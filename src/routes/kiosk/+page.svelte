<div class="fullscreen-container">
  <img
    src="/kiosk.png"
    alt="Kiosk display"
    class="centered-image"
  />
</div>

<style>
  .fullscreen-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: black;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .centered-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
</style>
