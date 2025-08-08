<script>
  import Divider from "$lib/components/divider.svelte";
</script>

<h1>wtf is affine space? (alternative explanation)</h1>
<p>
  Affine space aims to describe geometry without a fixed origin. Whereas in
  euclidian space every point is a vector from origo (0, 0), affine space
  geometry does not encode this information, but instead, it describes the
  relations between each point.
</p>
<br />
<br />
<p>
  What's most unintuitive about affine space, especially if you come from
  computer graphics, is that it does not require any transformation to convert
  from euclidian space. The affine space representation of any object is the
  same as euclidian space, this took me A WHILE to wrap my head around, and is
  the main reason why I'm writing this blog. A single affine space object can
  represent infinitely many euclidian space objects, and euclidian space objects
  can represent infinitely many affine space objects. The main difference is
  that, in euclidian space, the position of points matter, if you shift a
  triangle 2 units to the right, it's not the same geometry anymore, because
  it's that much further away from origo. In affine space though, this isn't the
  case, a triangle of the same <i>shape</i> is considered to be the same, wherever
  it is on the xy field.
</p>
<br />
<br />
<p>
  In practice there is data that can be thought of as being in affine space.
  Data, where the <i>position</i> of each object does not matter, but its
  relations to others does. The data is defined the same way as euclidian space
  data, there is no magic there, but what's special about this data, is that it
  allows us to perform <i>affine transformations</i> to it, that would change
  the physical data, but wouldn't change the encoded information that we care
  about.
  <b>
    By saying that data is in affine space, we are essentially saying that the
    information that we care about is encoded in such a way, that applying
    affine transormations wouldn't destroy, or modify it.
  </b>
</p>
<br />
<br />
<p>
  Affine transformations are a subset of euclidian space tranformations that
  don't change the shape of geometry. For example, adding vector (2,2) to all
  points of a triangle would be considerd an affine transformation, because it
  doesn't change the shape of the triangle.
</p>
<br />
<br />
<p>
  This blog is 5 paragraphs that explain affine space in an intuitive and
  practical way without hour long lectures or complex technical language. I had
  trouble mapping this in my head with the existing material on the internet, so
  I thought I'd shed a light on it from a different perspective. This is a very
  trivial concept, but for some way it's explained in such a convoluted way that
  it took me a full day to really understand it. Hopefully this blog explains it
  in a clear manner. 
</p>
