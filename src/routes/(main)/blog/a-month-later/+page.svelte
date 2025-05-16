<script>
  import Divider from "$lib/components/divider.svelte";
</script>

<h1>A month later (RyuLang)</h1>
<p>
  Original post seems stupid now, and it is. Luckily I'm not the person I was
  one month ago so it's okay.
</p>
<br />
<br />
<p>
  In this one I'd like to specify concrete ideas as for how I plan to make the
  dx of RyuLang better than anything in Python.
</p>
<Divider />
<h2>Types are gone, yet type safety isn't</h2>
<p>
  Every single variable is (except structs) treated the same, a tensor. Your
  loss is a 1x1 tensor, your strings are a 1D tensor of bytes, arrays
  initialized by hand, are also, tensors. Tensors (so in this case every single
  variable ever), are going to have built in functions that you can call, such
  as backward(). Since the language is JIT, you won't have to declare which
  values to autograd or not, you just do backward() wherever you need it and the
  compiler handles the rest for you.
  <br />
  <br />
  There are no tuples, classes, or anything like that, but there are structs. These
  aren't your typical C structs though, as they have special capabilities that don't
  exist in any other language. They're going to have magic functions, they can't
  hold primitive values, and they aren't stored in memory like a typical C struct.
  How these features will look in practice is difficult to explain, but it will make
  sense once the language is in a somewhat complete form.
  <br />
  <br />
  Structs' type safety is going to be a little weird and I'm not sure if this is
  going to be the final idea that I go with. The types of structs are going to be
  stored in a built in <b>type</b> field. This would allow you to build abstractions
  around the tensor struct, and use them as you will with the builtin features, as
  long as it doesn't break.
</p>
<Divider />
<h2>Everything is known at comptime</h2>
<p>
  A powerful language server is going to be at the heart of RyuLang. <b>Most</b>
  ML architectures don't require any kind of runtime tensor reshaping (as in determining
  shapes based on runtime values), therefore, at least for the first few versions,
  there is going to be a hard rule that every metadata field of a struct has to be
  known at compile time. Struct metadata include things such as size and shape.
  <br />
  <br />
  This enforcement will allow the language server to be immensely powerful. You'll
  be able to see the shapes, even values of any tensor in your program while coding,
  without ever running the code. The latter will be achieved by the language server
  running your code in the background, creating a super tight feedback loop. This
  won't always be the case of course, but for most of the <b>development</b>
  time, this feature will be accessible.
  <br />
  <br />
  The language server will run the code you write in the background while you program,
  calculating first few values of each tensor, caching them in memory, and presenting
  them to the user in their code editor. Once a value is changed, and file is saved,
  it would calculate which caches are invalid, and rerun the code.
  <br />
  <br />
  This is strictly only possible because of how targeted RyuLang is, it is specifically
  made for machine learning computation. There will never be a thing such as a "RyuLang
  codebase", I don't expect any program written in RyuLang to be bigger than say
  like, 5k lines max.
</p>
<Divider />
<h2>Package management</h2>
<p>
  I don't like the idea of a package manager, but I'd be dumb not to have any
  way of distributing code on a mass scale. There will probably be some sort of
  private package manager, or controlled package repository, to which anyone can
  contribute but only if they pass all checks. This seems like a mundane
  unnecessary change, but it is at the core of RyuLang's philosophy. If there
  exists a solution, there won't be another. If the old one can get better, it
  will.
</p>
<Divider />
<h2>Architecture</h2>
<p>
  Expansion on previous post. At the top there will be RyuLang itself, high
  level wrapper code around a custom hlo, called RHLO. I'll make a separate post
  about RHLO's architecture once it's more concrete, but it's not going to be
  too far from XLA. I aim to be more RISC, but not necessarily less complicated.
  <br />
  <br />
  The language repository will have minimal optimizations in it, I really want it
  to be as close as possible to RHLO. Kind of what C is to assembly. This is also
  a big component of RyuLang. I want the user to <b>truly</b> understand what they're
  writing. Of course, there will be the hlo abstraction, but once you figure out
  how that works, you would be able to easily translate the code you write into machine
  code in your head.
</p>
<Divider />
<h2>byebye (closing words)</h2>
<p>
  I'll probably write one final post about this langauge in a sales talk form, I
  haven't sold myself too much here. I write these mainly for feedback and
  documentation. Please write to me wherever and tell me what you think!
</p>
<Divider />
<h2>Repos :3</h2>
<p>Don't look too much into them, they're not in a good state rn</p>
<a href="https://github.com/oxrinz/ryulang">RyuLang</a> - The high level
implementation of RyuLang<br />
<a href="https://github.com/oxrinz/rhlo">RHLO</a> - The actual "compiler". This
is where most of the computation is done<br />
<a href="https://github.com/oxrinz/rhlo">RLLVM</a> - Util LLVM wrapper with cuda
calls and other stuff
