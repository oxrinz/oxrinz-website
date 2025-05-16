<script>
  import Divider from "$lib/components/divider.svelte";
</script>

<h1>RyuLang</h1>
<p>
  I'm making a programming language, and I want to list the basic ideas behind
  it here.
</p>
<br />
<br />
<p>
  This is a serious, although highly uneducated attempt at making a competitive
  language. It was initially supposed to be a small learning project to learn
  about gpu drivers and low level machine learning, but that was changed when I
  realized that, if I'm truly going to take on such a big project as making a
  programming language, might aswell give it my all and at least try to make it
  actually good.
</p>
<br />
<br />
<p>If you see stupid decisions being made, this is why ^.</p>
<br />
<br />
<p>
  Ryulang is going to be a simple, minimalistic machine learning compiler and
  language. It is exclusively made to write gpu code, (almost) every variable is
  assumed to exist and be handled on the gpu.
</p>
<Divider />
<h2>Why a language instead of a library?</h2>
<p>
  When I run code, I like to, at least at some level, understand what's going on
  inside my hardware. Running something as delicate as gpu orchestration in a vm
  feels very uncomfortable to me, as it prevents me from having a good deep
  understanding about what's going on under the hood. RyuLang is a machine
  learning compiler designed to fix few opinionated issues I experience when
  working on ML in python.
</p>
<br />
<br />
<h3>1. Python VM</h3>
<p>
  It's very good, but when working on something that requires pristine
  performance, VMs add alot of friction. RyuLang will compile to native
  binaries, allowing you to easily inspect your code and optimize it down to the
  last instruction.
</p>
<br />
<br />
<h3>2. Convention over configuration</h3>
<p>
  RyuLang won't have a package manager. There is only one ground truth in math,
  and thus, there will be only one solution per given problem. This will allow
  RyuLang to leverage the fact that it's a language, and provide numerous QoL
  features with its syntax. For example, I have ideas for how to make writing
  data paralellisation scripts easier in ways that PyTorch cannot, simply
  because it's not a language, but a library. These are mostly wip thoughts
  though and I won't showcase them here.
</p>
<br />
<br />
<h3>3. Lack of tooling</h3>
<p>
  It is very hard to accurately measure anything in PyTorch. RyuLang will come
  with alot of built in tools to reliably, among other things, measure
  performance, inspect control flow and benchmark the insides of your gpu.
</p>
<Divider />
<h2>Practical usage</h2>
<p>
  RyuLang is not designed to be used as a standalone language, but instead, to
  be used alongside others. It will come with a few built in tools, like fs for
  saving models, but for the most part the language is going to be "incomplete",
  lacking any kind of standard library.
</p>
<br />
<br />
<p>
  I plan to make it easy to be used with Python, with other languages in
  consideration. Easy bindings and a pip package to easily interface compiled
  RyuLang code are both on my to-do list. Depending on whether you use RyuLang
  for training or inference, ideally you would write your gpu code in RyuLang,
  and use python to handle the output and distribute it in your application.
</p>
<br />
<br />
<p>
  Aside from being a language, RyuLang will also have its own machine learning
  IR, allowing you to potentially use it as a PyTorch backend. This is unlikely
  though as I don't plan to spend the rest of my life working on this language.
</p>
<Divider />
<h2>Syntax</h2>
<p>
  I won't show the syntax here, but I will explain my thoughts regarding it. In
  short, RyuLang will be a mixture of zig and python. Leveraging zig's clarity
  and python's simplicity, RyuLang will look like a minimal and readable
  language. If you've ever only written Python, you will probably find it
  overwhelming, but if you're an experienced developer across multiple domains,
  you will more than likely come to love it.
</p>
<Divider />
<h2>Architecture</h2>
<p>
  As mentioned earlier, RyuLang will compile to an HLO set. Most likely
  StableHLO / some sort of expanded version of it to make it easy to integrate
  with PyTorch and other frameworks. This will also allow me to easily add XLA
  as a backend to RyuLang, in case I ever want to do that.
</p>
<br />
<br />
<p>
  The language will be lazy, although hidden lazy, there will be no realize
  functions, you will only see the computations being done when you need them.
  The tooling will make this seemless though, and you will be able to
  technically write code without thinking about laziness, although it will be
  something that would be good to keep in mind.
</p>
<br />
<br />
<p>
  Since this is primarily a learning project, I'd like to write as much as I can
  from scratch. This will potentially include things such as custom drivers. I
  would love to write amd drivers, maybe even nvidia, if I find the time for it.
</p>
<Divider />
<p>
  I have alot of unexplored ideas regarding this langauge, and I will probably
  update this page as I go.
</p>
<br />
<br />
<p class="text-neutral-400"><i>Last updated: 14.04.2025</i></p>

<style>
  pre {
    @apply !bg-rose-950/5 border-rose-900/50 !border-[1px];
    border-radius: 5px;
    padding: 1rem;
    overflow-x: auto;
  }
</style>
