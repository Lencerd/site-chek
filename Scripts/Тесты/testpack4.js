const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Загружаем исходный скрипт карусели и добавляем поддержку клавиатуры
const carouselScript = fs.readFileSync(path.resolve(__dirname, 'carousel.js'), 'utf8') + `
  // Добавляем поддержку управления клавиатурой
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      rotationY += 5;
      velocity = 0.5;
      autoRotate = false;
      updateCarousel();
    } else if (e.key === 'ArrowRight') {
      rotationY -= 5;
      velocity = -0.5;
      autoRotate = false;
      updateCarousel();
    } else if (e.key === ' ') {
      autoRotate = !autoRotate;
    }
  });
`;

// Настраиваем JSDOM с каруселью и шестью слайдами для разнообразия
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
  <body>
    <div id="carousel">
      <div id="carouselStage">
        <div class="slide"></div>
        <div class="slide"></div>
        <div class="slide"></div>
        <div class="slide"></div>
        <div class="slide"></div>
        <div class="slide"></div>
      </div>
    </div>
  </body>
  </html>
`, { runScripts: 'dangerously' });

const { window } = dom;
global.document = window.document;
global.window = window;
global.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 16));
global.cancelAnimationFrame = jest.fn();

// Вставляем скрипт карусели с поддержкой клавиатуры в JSDOM
const scriptEl = window.document.createElement('script');
scriptEl.textContent = carouselScript;
window.document.body.appendChild(scriptEl);

// Мокаем console.error для отслеживания ошибок
console.error = jest.fn();

describe('Дополнительные тесты карусели с поддержкой клавиатуры', () => {
  let carousel, stage, slides;

  beforeEach(() => {
    // Инициализируем элементы и сбрасываем состояние
    carousel = document.getElementById('carousel');
    stage = document.getElementById('carouselStage');
    slides = stage.children;
    jest.clearAllMocks();
    window.rotationY = 0;
    window.dragging = false;
    window.velocity = 0;
    window.autoRotate = true;
    window.lastX = 0;
    window.setupCarousel();
    window.updateCarousel();
  });

  describe('Управление клавиатурой', () => {
    test('стрелка влево должна увеличивать rotationY и устанавливать velocity', () => {
      const event = new window.KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);
      expect(window.rotationY).toBe(5);
      expect(window.velocity).toBe(0.5);
      expect(window.autoRotate).toBe(false);
      expect(stage.style.transform).toBe(`translateZ(-400px) rotateY(5deg)`);
    });

    test('стрелка вправо должна уменьшать rotationY и устанавливать velocity', () => {
      const event = new window.KeyboardEvent('keydown', { key: 'ArrowRight' });
      window.dispatchEvent(event);
      expect(window.rotationY).toBe(-5);
      expect(window.velocity).toBe(-0.5);
      expect(window.autoRotate).toBe(false);
      expect(stage.style.transform).toBe(`translateZ(-400px) rotateY(-5deg)`);
    });

    test('пробел должен переключать autoRotate', () => {
      const event = new window.KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(event);
      expect(window.autoRotate).toBe(false);
      window.dispatchEvent(event);
      expect(window.autoRotate).toBe(true);
    });

    test('другие клавиши не должны влиять на карусель', () => {
      const initialRotation = window.rotationY;
      const event = new window.KeyboardEvent('keydown', { key: 'Enter' });
      window.dispatchEvent(event);
      expect(window.rotationY).toBe(initialRotation);
      expect(window.velocity).toBe(0);
      expect(window.autoRotate).toBe(true);
    });
  });

  describe('Тестирование отзывчивости', () => {
    test('должен корректно обрабатывать изменение размера окна', () => {
      window.innerWidth = 800;
      window.setupCarousel();
      for (let i = 0; i < slides.length; i++) {
        const angle = (360 / slides.length) * i;
        expect(slides[i].style.transform).toBe(`rotateY(${angle}deg) translateZ(400px)`);
      }
      window.innerWidth = 400;
      window.setupCarousel();
      expect(slides[0].style.transform).toBe(`rotateY(0deg) translateZ(400px)`);
    });

    test('должен корректно работать при очень малом размере экрана', () => {
      window.innerWidth = 100;
      window.setupCarousel();
      expect(slides.length).toBe(6);
      expect(window.theta).toBe(360 / 6); // 60 градусов
      expect(stage.style.transform).toBe(`translateZ(-400px) rotateY(0deg)`);
    });
  });

  describe('Обработка некорректных стилей', () => {
    test('должен игнорировать некорректные значения transform у слайдов', () => {
      slides[0].style.transform = 'invalid';
      window.setupCarousel();
      expect(slides[0].style.transform).toBe(`rotateY(0deg) translateZ(400px)`);
    });

    test('должен корректно восстанавливать stage после удаления стилей', () => {
      stage.style.transform = '';
      window.updateCarousel();
      expect(stage.style.transform).toBe(`translateZ(-400px) rotateY(0deg)`);
    });
  });

  describe('Стресс-тесты взаимодействия', () => {
    test('должен корректно обрабатывать одновременные клавиатура и мышь', () => {
      const keyEvent = new window.KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const mouseDown = new window.MouseEvent('mousedown', { clientX: 100 });
      const mouseMove = new window.MouseEvent('mousemove', { clientX: 150 });
      window.dispatchEvent(keyEvent);
      carousel.dispatchEvent(mouseDown);
      window.dispatchEvent(mouseMove);
      expect(window.rotationY).toBe(5 + (150 - 100) * 0.3);
      expect(window.velocity).toBe((150 - 100) * 0.1);
      expect(window.dragging).toBe(true);
      expect(window.autoRotate).toBe(false);
    });

    test('должен корректно обрабатывать одновременные клавиатура и touch', () => {
      const keyEvent = new window.KeyboardEvent('keydown', { key: 'ArrowRight' });
      const touchStart = new window.TouchEvent('touchstart', { touches: [{ clientX: 200 }] });
      const touchMove = new window.TouchEvent('touchmove', { touches: [{ clientX: 250 }] });
      window.dispatchEvent(keyEvent);
      carousel.dispatchEvent(touchStart);
      window.dispatchEvent(touchMove);
      expect(window.rotationY).toBe(-5 + (250 - 200) * 0.3);
      expect(window.velocity).toBe((250 - 200) * 0.1);
      expect(window.dragging).toBe(true);
      expect(window.autoRotate).toBe(false);
    });

    test('должен корректно обрабатывать множественные быстрые нажатия клавиш', () => {
      const events = [
        new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }),
        new window.KeyboardEvent('keydown', { key: 'ArrowRight' }),
        new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }),
      ];
      events.forEach((event) => window.dispatchEvent(event));
      expect(window.rotationY).toBe(5 - 5 + 5); // +5 -5 +5
      expect(window.velocity).toBe(0.5); // Последняя стрелка влево
    });
  });

  describe('Длительные сценарии', () => {
    test('должен корректно обрабатывать длительное нажатие клавиш', () => {
      for (let i = 0; i < 50; i++) {
        const event = new window.KeyboardEvent('keydown', { key: 'ArrowLeft' });
        window.dispatchEvent(event);
      }
      expect(window.rotationY).toBe(50 * 5);
      expect(window.velocity).toBe(0.5);
      expect(window.autoRotate).toBe(false);
    });

    test('должен корректно затухать velocity после клавиатурного ввода', () => {
      const event = new window.KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);
      expect(window.velocity).toBe(0.5);
      for (let i = 0; i < 50; i++) {
        window.animate();
      }
      expect(window.velocity).toBeLessThan(0.001);
    });
  });

  describe('Краевые случаи', () => {
    test('должен корректно обрабатывать отсутствие slidesCount', () => {
      window.slidesCount = undefined;
      window.setupCarousel();
      expect(window.slidesCount).toBe(6);
      expect(window.theta).toBe(360 / 6);
    });

    test('должен корректно обрабатывать некорректный radius', () => {
      window.radius = 'invalid';
      window.setupCarousel();
      for (let i = 0; i < slides.length; i++) {
        const angle = (360 / slides.length) * i;
        expect(slides[i].style.transform).toBe(`rotateY(${angle}deg) translateZ(0px)`);
      }
    });

    test('должен корректно обрабатывать очень большое количество кадров', () => {
      window.autoRotate = true;
      for (let i = 0; i < 5000; i++) {
        window.animate();
      }
      expect(window.rotationY).toBeCloseTo(5000 * 0.03, 5);
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(5000);
    });

    test('должен корректно обрабатывать пробел при активном dragging', () => {
      window.dragging = true;
      const event = new window.KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(event);
      expect(window.autoRotate).toBe(true); // Пробел переключает autoRotate
      expect(window.dragging).toBe(true); // Dragging не сбрасывается
    });
  });
});