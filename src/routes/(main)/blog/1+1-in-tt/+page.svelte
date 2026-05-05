<script>
  import Divider from "$lib/components/divider.svelte";
  import CodeBlock from "$lib/components/code-block.svelte";
</script>

<h1>How to compute 1+1 using tenstorrent in only 100 lines of python</h1>
<h2>Intro (safe to skip)</h2>
<p>
  I don't expect anyone to read this, but if you're one of the friends that I
  linked this to, you will need context. Tenstorrent consists of a matrix of
  something called Tensix cores, there's a visualization of the processor
  <a
    href="https://github.com/tenstorrent/tt-isa-documentation/tree/main/BlackholeA0"
    target="_blank"
    rel="noopener noreferrer">here</a
  >. We're going to use the T boxes, which represent the aforementioned Tensix
  cores.
</p>
<h2>1+1</h2>
<p>
  Pick an arbitrary tensix core. Any. I'm going to pick the one at (1, 2). Nice.
  That Tensix core has 5 BRISC cores, and a main coprocessor that youre
  <em>supposed</em> to use. We will not be using the coprocessor, that would be
  way too efficient. Each Tensix has a
  <a
    href="https://github.com/tenstorrent/tt-isa-documentation/blob/main/BlackholeA0/TensixTile/SoftReset.md"
    target="_blank"
    rel="noopener noreferrer">reset register</a
  > which we will need to access in order to get it to execute instructions.
</p>
<br />
<br />
<p>
  Before we start we're gonna need to define a few constants as well as the
  device fd, they're self evident so I'm not going to explain them.
</p>

<CodeBlock
  code={String.raw`TLB_SIZE = 2 * 1024 * 1024
SOFT_RESET = 0xFFB121B0
TLB_RESET_REG_BASE = SOFT_RESET & ~(TLB_SIZE - 1)
TLB_OFFSET = SOFT_RESET - TLB_RESET_REG_BASE

NOC, X, Y = 0, 1, 2

fd = os.open("/dev/tenstorrent/0", os.O_RDWR | os.O_CLOEXEC)`}
/>

<CodeBlock
  code={String.raw`a = struct_tenstorrent_allocate_tlb()
a.inp.size = size
fcntl.ioctl(fd, TENSTORRENT_IOCTL_ALLOCATE_TLB, a)`}
/>

<p>
  Here we allocate a TLB of size 2MB. Tenstorrent supports two sizes of TLBs,
  2MB and 4GB. If you understand why these chips don't support arbitrary size
  TLBs, please tell me.
</p>

<CodeBlock
  code={String.raw`c = struct_tenstorrent_configure_tlb()
c.inp.id = a.out.id
c.inp.config.addr = base
c.inp.config.x_start = X
c.inp.config.x_end = X
c.inp.config_y_start = Y
c.inp.config.y_end = Y
c.inp.config.noc = NOC
fcntl.ioctl(fd, TENSTORRENT_IOCTL_CONFIGURE_TLB, c)
m = mmap.mmap(
    fd,
    size,
    mmap.MAP_SHARED,
    mmap.PROT_READ | mmap.PROT_WRITE,
    offset=a.out.mmap_offset_uc,
)`}
/>

<p>
  Here we mmap the TLB into our memory space, allowing us to read and write into
  the reset register.
</p>

<CodeBlock
  code={String.raw`val = ctypes.c_uint32.from_buffer(rm, TLB_OFFSET).value
print(f"\nSOFT_RESET_0 at Tensix ({X}, {Y}) = 0x{val:08x}")
print(f"  bit   " + "".join(str((31 - i) // 10) for i in range(32)))
print(f"        " + "".join(str((31 - i) % 10) for i in range(32)))
print(f"  val   {val:032b}")`}
/>

<p>
The register we're reading is the first one that's listed <a
  href="https://github.com/tenstorrent/tt-isa-documentation/blob/main/BlackholeA0/TensixTile/SoftReset.md"
  target="_blank"
  rel="noopener noreferrer">here</a
>. The code above prints the reset register state, it should look something like this.
</p>

<CodeBlock
  lang="plain"
  code={String.raw`SOFT_RESET_0 at Tensix (1, 2) = 0x00047800
  bit   33222222222211111111110000000000
        10987654321098765432109876543210
  val   00000000000001000111100000000000`}
/>

<p>
The bit of id 11 is the one we care about. It controls the reset state of BRISC which is the first out of 5 baby risc cores in each Tensix core. Plan: we write instructions to the BRISC's instruction memory (after reset pc is set to 0x0), set reset bit to 0, wait for a bit and then finally read the memory it writes to.
</p>

<CodeBlock
  code={String.raw`# reset register tlb
ra = alloc_tlb(fd, TLB_SIZE)
rm = configure_tlb(fd, ra, TLB_SIZE, TLB_RESET_REG_BASE, 0, 1, 2)

val = ctypes.c_uint32.from_buffer(rm, TLB_OFFSET).value
print(f"\nSOFT_RESET_0 at Tensix ({X}, {Y}) = 0x{val:08x}")
print(f"  bit   " + "".join(str((31 - i) // 10) for i in range(32)))
print(f"        " + "".join(str((31 - i) % 10) for i in range(32)))
print(f"  val   {val:032b}")

# memory tlb
ma = alloc_tlb(fd, TLB_SIZE)
mm = configure_tlb(fd, ma, TLB_SIZE, 0x0, 0, 1, 2)

write_program(
    mm,
    0,
    li(10, 1),
    li(11, 1),
    add(12, 10, 11),
    sw(12, 0x100, 0),
    j_self(),
)


val = ctypes.c_uint32.from_buffer(rm, TLB_OFFSET).value
ctypes.c_uint32.from_buffer(rm, TLB_OFFSET).value = val & ~0x800

time.sleep(0.01)

print(f"L1[0x100] after:  0x{ctypes.c_uint32.from_buffer(mm, 0x100).value:08x}")`}
/>

<p>
And the result is... 2!
</p>

<CodeBlock
  lang="plain"
  code={String.raw`L1[0x100] after:  0x00000002`}
/>

<p>
Congratulations, you just created the world's worst calculator. I will publish it once it's ready. Code is as github.com/oxrinz/something
</p>
