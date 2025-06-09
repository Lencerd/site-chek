
const carousels = document.querySelectorAll('.carousel');

carousels.forEach(carousel => {
  const stage = carousel.querySelector('.carousel__stage');
  const slides = stage.children;
  const radius = 400;
  const autoRotateSpeed = 0.03;
  let autoRotate = true;
  let rotationY = 0;
  let dragging = false;
  let lastX = 0;
  let velocity = 0;
  const slidesCount = slides.length;
  const theta = 360 / slidesCount;

  function setupCarousel() {
    for (let i = 0; i < slidesCount; i++) {
      const slide = slides[i];
      const angle = theta * i;
      slide.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
    }
  }

  function updateCarousel() {
    stage.style.transform = `translateZ(-${radius}px) rotateY(${rotationY}deg)`;
  }

  setupCarousel();
  updateCarousel();

  function animate() {
    if (!dragging && autoRotate) {
      rotationY += autoRotateSpeed;
    } else {
      rotationY += velocity;
      velocity *= 0.95;
      if (Math.abs(velocity) < 0.001) velocity = 0;
    }
    updateCarousel();
    requestAnimationFrame(animate);
  }
  animate();

  carousel.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    velocity = 0;
    autoRotate = false;
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
    autoRotate = true;
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const deltaX = e.clientX - lastX;
    rotationY += deltaX * 0.3;
    velocity = deltaX * 0.1;
    lastX = e.clientX;
    updateCarousel();
  });

  carousel.addEventListener('touchstart', (e) => {
    dragging = true;
    lastX = e.touches[0].clientX;
    velocity = 0;
    autoRotate = false;
  });

  window.addEventListener('touchend', () => {
    dragging = false;
    autoRotate = true;
  });

  window.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const deltaX = e.touches[0].clientX - lastX;
    rotationY += deltaX * 0.3;
    velocity = deltaX * 0.1;
    lastX = e.touches[0].clientX;
    updateCarousel();
  });
});
