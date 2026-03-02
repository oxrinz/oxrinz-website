<script>
  import Divider from "$lib/components/divider.svelte";
</script>

<h1>linux graphics</h1>
<p>
  Rendering is the process of taking a description and transforming it into a
  final form. Graphics rendering is the process of taking data about a "scene"
  and turning it into a series of bytes (buffers) representing the color to be
  displayed on a screen. They are sent to the monitor every time you want to
  display them. Because rendering and sending the buffers don't happen
  instantaneously, if you were to send a buffer to the monitor every time you
  render, you'd run into hazards in which the monitor would be rendering buffers
  that are not yet ready. Double buffering is a technique where instead of a
  single buffer, you allocate two, and alternate between rendering into one
  while the monitor scans the other. Every frame, you swap the buffer to which
  you render / which monitor scans, this is called page flipping.
</p>
<br />
<br />
<p>
  DRM stands for Direct Rendering manager, which is a Linux subsystem and
  userspace API (or rather, a set of APIs scattered all across Linux) for
  graphics devices. Confusingly, monitors are technically a "device", but since
  they are plugged into the grahpics devices, there is no seperate subsystem for
  managing monitor output.
</p>
<br />
<br />
<p>
  DRI stands for Direct Rendering Interface. When you boot or plug in your GPU,
  DRM automatically populates the /dev/dri directory with two files per card:
  cardN and renderDNNN. The card file is used for mode setting, which is a name
  for telling the monitor metadata about the display, for example the resoluion,
  refresh rate, pixel format, etc. Render file is in turn used for rendering. I
  did not see that coming from a mile away. Most of the DRM API is in the form
  of ioctls over the files in this folder.
</p>
<br />
<br />
<p>
  You will often hear the name KMS (Kernel Mode Setting), which might... will
  confuse you. KMS is not something that you directly interact with. It is a
  subsystem of DRM which takes care of the mode setting. Doing anything with DRM
  doesn't require you to know about the existence of KMS, but it would help to
  avoid confusion.
</p>
<br />
<br />
<p>
  libdrm is a close, near wrapper-level abstraction over DRM. The first libdrm
  call you'd typically do is drmModeGetResources, which returns a struct listing
  object IDS of:
</p>
<ul>
  <li>
    <b>Connectors</b>: Physical outputs. These are typically your HDMI / DP
    ports.
  </li>
  <li>
    <b>CRTCs</b>: Cathode Ray Tube Controllers. Historical name that nowdays
    represents "display scanout controllers". They handle page flips, timing and
    scanning out buffers.
  </li>
  <li>
    <b>Encoders</b>: Blocks inside of the graphics devices that handle signal
    converstions. They take the inputs from CRTC and encode them into the link
    format (HDMI, DP, VGA, etc.)
  </li>
  <li>
    <b>Min/Max framebuffer sizes</b>: Driver limitations imposed on resolution.
  </li>
</ul>
<p>
  CRTCs and encoders are interchangeable, and not always compatible with each
  other. It is your job to choose which CRTCs, encoders and connectors to use
  and make sure they're all compatible with each other.
</p>
<br />
<br />
<p>
  GBM, or General Buffer Management is a... buffer management API provided by
  Mesa, not related to DRM. It is what you use to allocate the framebuffers,
  which you then pass to DRM and your favorite graphics api (which obviously is,
  and should be, Vulkan). You typically allocate a buffer object (bo) with GBM,
  which is an GBM specific abstraction in the form of an opaque object
  representing allocated gpu memory. You don't poke it yourself, but you use it
  when calling other APIs. In order to do that, you ask GBM to give you a
  dma-buf (Direct Memory Access buffer), which is Linux's mechanism for sharing
  buffers across drivers with a file descriptor.
</p>
<br />
<br />
<p>
  In order to scan out the buffer object with DRM you need to create a DRM side
  representation of the allocated memory. You do this by creating a DRM frame
  buffer, which confusingly is not a buffer, but metadata around an existing
  buffer (if you read super carefully you might begin to notice a pattern with
  confusing naming schemes). dma-buf is only used for sharing the buffers, not
  using the buffers internally. In order to use the buffer in DRM you need to
  create a Graphics Execution Manager (GEM) handle from the dma-buf. GEM is part
  of DRM that confusingly (again) does not handle graphics execution, but buffer
  management.
</p>
