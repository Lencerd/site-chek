const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Загружаем скрипт карусели
const carouselScript = fs.readFileSync(path.resolve(__dirname, 'carousel.js'), 'utf8');

// Настраиваем окружение JSDOM с каруселью и пятью слайдами для разнообразия
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

// Вставляем скрипт карусели в JSDOM
const scriptEl = window.document.createElement('script');
scriptEl.textContent = carouselScript;
window.document.body.appendChild(scriptEl);

// Мокаем console.error для отслеживания ошибок
console.error = jest.fn();

describe('Дополнительные тесты карусели', () => {
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

  describe('Проверка производительности анимации', () => {
    test('анимация должна вызываться не чаще одного раза за кадр', () => {
      const rafSpy = jest.spyOn(global, 'requestAnimationFrame');
      window.animate();
      window.animate(); // Пытаемся вызвать повторно
      expect(rafSpy).toHaveBeenCalledTimes(1); // Должен быть только один вызов
    });

    test('анимация должна корректно обновлять rotationY за несколько кадров', () => {
      window.dragging = false;
      window.autoRotate = true;
      const initialRotation = window.rotationY;
      window.animate(); // Один кадр
      window.animate(); // Второй кадр
      expect(window.rotationY).toBeCloseTo(initialRotation + 0.03 * 2, 5);
    });
  });

  describe('Обработка некорректных DOM-элементов', () => {
    test('должен не ломаться, если carousel отсутствует', () => {
      document.getElementById('carousel').remove();
      expect(() => window.setupCarousel()).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    test('должен не ломаться, если stage отсутствует', () => {
      document.getElementById('carouselStage').remove();
      expect(() => window.setupCarousel()).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    test('должен корректно работать с пустым stage', () => {
      while (stage.children.length > 0) {
        stage.removeChild(stage.lastChild);
      }
      expect(() => window.setupCarousel()).not.toThrow();
      expect(window.slidesCount).toBe(0);
      expect(window.theta).toBe(Infinity);
    });
  });

  describe('Проверка обработки событий', () => {
    test('должен корректно обрабатывать одновременные mousedown и touchstart', () => {
      const mouseEvent = new window.MouseEvent('mousedown', { clientX: 100 });
      const touchEvent = new window.TouchEvent('touchstart', { touches: [{ clientX: 200 }] });
      carousel.dispatchEvent(mouseEvent);
      carousel.dispatchEvent(touchEvent);
      expect(window.lastX).toBe(200); // Touch должен перезаписать mousedown
      expect(window.dragging).toBe(true);
      expect(window.autoRotate).toBe(false);
    });

    test('должен игнорировать некорректные touchmove без touches', () => {
      window.dragging = true;
      window.lastX = 100;
      const initialRotation = window.rotationY;
      const event = new window.TouchEvent('touchmove', { touches: [] });
      window.dispatchEvent(event);
      expect(window.rotationY).toBe(initialRotation); // Не должно быть изменений
      expect(window.velocity).toBe(0);
    });

    test('должен корректно обрабатывать множественные touchmove', () => {
      window.dragging = true;
      window.lastX = 100;
      const event1 = new window.TouchEvent('touchmove', { touches: [{ clientX: 150 }] });
      const event2 = new window.TouchEvent('touchmove', { touches: [{ clientX: 200 }] });
      window.dispatchEvent(event1);
      window.dispatchEvent(event2);
      expect(window.rotationY).toBeCloseTo((150 - 100 + 200 - 150) * 0.3, 5);
      expect(window.velocity).toBeCloseTo((200 - 150) * 0.1, 5);
    });
  });

  describe('Проверка изменения параметров', () => {
    test('должен корректно работать с изменённым радиусом', () => {
      window.radius = 800;
      window.setupCarousel();
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const angle = (360 / slides.length) * i;
        expect(slide.style.transform).toBe(`rotateY(${angle}deg) translateZ(800px)`);
      }
      window.updateCarousel();
      expect(stage.style.transform).toBe(`translateZ(-800px) rotateY(0deg)`);
    });

    test('должен корректно обрабатывать изменение autoRotateSpeed', () => {
      window.autoRotateSpeed = 0.06;
      window.dragging = false;
      window.autoRotate = true;
      const initialRotation = window.rotationY;
      window.animate();
      expect(window.rotationY).toBe(initialRotation + 0.06);
    });

    test('должен корректно обрабатывать выключенную авто-ротацию', () => {
      window.autoRotate = false;
      const initialRotation = window.rotationY;
      window.animate();
      expect(window.rotationY).toBe(initialRotation);
    });
  });

  describe('Краевые случаи и стресс-тесты', () => {
    test('должен корректно обрабатывать большое количество слайдов', () => {
      // Добавляем 50 слайдов
      for (let i = 0; i < 45; i++) {
        const slide = document.createElement('div');
        slide.className = 'slide';
        stage.appendChild(slide);
      }
      window.setupCarousel();
      expect(window.slidesCount).toBe(50);
      expect(window.theta).toBe(360 / 50);
      for (let i = 0; i < stage.children.length; i++) {
        const slide = stage.children[i];
        const angle = (360 / 50) * i;
        expect(slide.style.transform).toBe(`rotateY(${angle}deg) translateZ(400px)`);
      }
    });

    test('должен корректно обрабатывать экстремальные значения velocity', () => {
      window.dragging = false;
      window.autoRotate = false;
      window.velocity = 1000; // Очень большая скорость
      window.animate();
      expect(window.rotationY).toBe(1000);
      expect(window.velocity).toBe(1000 * 0.95);
    });

    test('должен корректно останавливать velocity при малых значениях', () => {
      window.dragging = false;
      window.autoRotate = false;
      window.velocity = 0.0001;
      window.animate();
      expect(window.velocity).toBe(0);
    });

    test('должен корректно обрабатывать быстрые изменения dragging', () => {
      const mouseDown = new window.MouseEvent('mousedown', { clientX: 100 });
      const mouseUp = new window.MouseEvent('mouseup');
      carousel.dispatchEvent(mouseDown);
      expect(window.dragging).toBe(true);
      window.dispatchEvent(mouseUp);
      expect(window.dragging).toBe(false);
      carousel.dispatchEvent(mouseDown);
      expect(window.dragging).toBe(true);
    });

    test('должен корректно обрабатывать отсутствие transform у stage', () => {
      stage.style.transform = '';
      expect(() => window.updateCarousel()).not.toThrow();
      expect(stage.style.transform).toBe(`translateZ(-400px) rotateY(0deg)`);
    });
  });

  describe('Проверка событийной последовательности', () => {
    test('должен корректно обрабатывать последовательность mousedown-mousemove-mouseup', () => {
      const mouseDown = new window.MouseEvent('mousedown', { clientX: 100 });
      const mouseMove = new window.MouseEvent('mousemove', { clientX: 150 });
      const mouseUp = new window.MouseEvent('mouseup');
      carousel.dispatchEvent(mouseDown);
      window.dispatchEvent(mouseMove);
      window.dispatchEvent(mouseUp);
      expect(window.rotationY).toBe((150 - 100) * 0.3);
      expect(window.velocity).toBe((150 - 100) * 0.1);
      expect(window.dragging).toBe(false);
      expect(window.autoRotate).toBe(true);
    });

    test('должен корректно обрабатывать последовательность touchstart-touchmove-touchend', () => {
      const touchStart = new window.TouchEvent('touchstart', { touches: [{ clientX: 200 }] });
      const touchMove = new window.TouchEvent('touchmove', { touches: [{ clientX: 250 }] });
      const touchEnd = new window.TouchEvent('touchend');
      carousel.dispatchEvent(touchStart);
      window.dispatchEvent(touchMove);
      window.dispatchEvent(touchEnd);
      expect(window.rotationY).toBe((250 - 200) * 0.3);
      expect(window.velocity).toBe((250 - 200) * 0.1);
      expect(window.dragging).toBe(false);
      expect(window.autoRotate).toBe(true);
    });
  });
});