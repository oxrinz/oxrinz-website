<script>
let code_1 = 
`fn $add($a, $b) {
  ret $a + $b
}

$a = $init([3])
$b = $init([3])
$c = $init([3])

$c = $add($a, $b)

result = $c
@print(result)
`;

let code_2 = 
`fn $add($a, $b) {
  ret $a + $b
}
`;

let code_3 = 
`$a = $init([3])
$b = $init([3])
$c = $init([3])
`;

let code_4 = 
`$c = $add($a, $b)

result = $c
@print(result)
`;

let code_5 = 
`$bank = @LayerBank()
$bank.layer1 = @Linear(2, 5)
$bank.layer2 = @Linear(5, 3)
  
fn forward($x) {
  $x = $bank.layer1($x)
  $x = $bank.layer2($x)
  return $x
}
  
$input = @arange(0, 2)
$target = @fill([3], 0)

$loss = 99999
$optim = @SGD(bank)

while (loss > 0.01) {
  $out = forward($input)
  $loss = @mse($out, $target)
  $loss.backward()
  $optim.step()
  $back.zero_grad()
  loss = $loss
  print()
}`;

let code_6 = 
`$bank = @LayerBank()
$bank.layer1 = @Linear(2, 5)
$bank.layer2 = @Linear(5, 3)
  
fn forward($x) {
  $x = $bank.layer1($x)
  $x = $bank.layer2($x)
  return $x
}
  
$input = @arange(0, 2)
$target = @fill([3], 0)

$loss = 99999
$optim = @SGD(bank)

while (loss > 0.01) {
  $out = forward($input)
  $loss = @mse($out, $target)
  $loss.backward()
  $optim.step()
  $back.zero_grad()
  loss = $loss
  print()
}`;
</script>

<style>
  pre {
    @apply !bg-rose-950/5 border-rose-900/50 !border-[1px];
    border-radius: 5px;
    padding: 1rem;
    overflow-x: auto;
  }
</style>

-- WIP --
<h1>Ryuthon</h1>
I'm making a programming language, here are the basic ideas behind it. 
It's supposed to replace python for machine learning tasks. 
Obviously, this is not going to happen, but that doesn't mean this is not going to be a completely valid, usable and competitive language.
<br/>
<br/>
It will feel similar to python, with the exception of few opinionated semantics, and the ability to run GPU kernels from within the language. 
Like python, ryuthon will be expression leaned, function calls among other things will be parsed as expressions, and as such, they will always return a value.
<br/>
<br/>
The language will be compiled to LLVM and PTX, with other gpu backends potentially being added in the future. 
I'm very excited about XLA, and I'd love to have it as a backend in ryuthon, but that'll take a lot of time and effort to get working.
<br/>
<br/>
<h2>Syntax</h2>
<pre><code class="">{code_1}</code></pre>
<br/>
Alot to break down. First the kernel declaration
<br/>
<br/>
<pre><code class="">{code_2}</code></pre>
<br/>
First, the $ sign. 
It's not a naming convention, the $ sign is built in to the language. 
It is used to indicate device functions and variables. 
Function inputs are assumed to be arrays, and their thread and block ids are calculated automatically.
<br/>
<br/>
<pre><code class="">{code_3}</code></pre>
<br/>
Variable declarations. The $ sign signify that both, variables and the initialization function calls are device type. Note, that were any of these host type (without the $), the code would not be valid. Although this language is dynamically typed, a variable can only be either device or host in their lifetime. This will be expanded on later.
<br/>
<br/>
<pre><code class="">{code_4}</code></pre>
<br/>
Kernel call and result printing. Kernel call is a misleading term, since your whole program will be compiled into a single kernel and sent to the GPU before your program runs. For this reason, it's more accurate to call it kernel function call, but for simplicity and convention, I'll be calling them kernel calls.
<br/>
<br/>
Next line, you see device to host type conversion. As you can see, it is as simple as assigning a host variable to a gpu variable, copying over the data from gpu to cpu. This is done because in the next line, a host function is called, print(). Since print is a host function, the data passed to it has to be explicitly converted to host type before call. 
<br/>
<br/>
<h2>ML Library</h2>
<pre><code class="">{code_5}</code></pre>
<br/>
This is, completely valid code, it'll compile and execute as you'd expect. It's not the way of making a neural network in this langauge, but it is a way.

<br/>
<br/>
<pre><code class="">{code_6}</code></pre>
<br/>