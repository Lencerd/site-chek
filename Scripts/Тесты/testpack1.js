const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Загружаем скрипт карусели
const carouselScript = fs.readFileSync(path.resolve(__dirname, 'carousel.js'), 'utf8');

// Настраиваем окружение JSDOM
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
  <body>
    <div id="carousel">
      <div id="carouselStage">
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

// Вставляем скрипт карусели в окружение JSDOM
const scriptEl = window.document.createElement('script');
scriptEl.textContent = carouselScript;
window.document.body.appendChild(scriptEl);

// Мокаем console.error для отслеживания ошибок во время тестов
console.error = jest.fn();

describe('Функциональность карусели', () => {
  let carousel, stage, slides;

  beforeEach(() => {
    // Сбрасываем переменные и моки
    carousel = document.getElementById('carousel');
    stage = document.getElementById('carouselStage');
    slides = stage.children;
    jest.clearAllMocks();
    // Сбрасываем состояние вращения и другие параметры
    window.rotationY = 0;
    window.dragging = false;
    window.velocity = 0;
    window.autoRotate = true;
    window.lastX = 0;
    // Повторно выполняем настройку карусели
    window.setupCarousel();
    window.updateCarousel();
  });

  describe('Инициализация', () => {
    test('должен корректно выбрать элементы карусели и сцены', () => {
      expect(carousel).toBeInstanceOf(HTMLElement);
      expect(stage).toBeInstanceOf(HTMLElement);
      expect(slides.length).toBe(3);
    });

    test('должен правильно рассчитать угол theta на основе количества слайдов', () => {
      expect(window.theta).toBe(360 / 3); // 3 слайда -> 120 градусов
    });

    test('должен настроить слайды с правильными трансформациями', () => {
      const radius = 400;
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const angle = (360 / slides.length) * i;
        const expectedTransform = `rotateY(${angle}deg) translateZ(${radius}px)`;
        expect(slide.style.transform).toBe(expectedTransform);
      }
    });

    test('должен инициализировать трансформацию сцены', () => {
      const radius = 400;
      expect(stage.style.transform).toBe(`translateZ(-${radius}px) rotateY(0deg)`);
    });
  });

  describe('Обновление карусели', () => {
    test('должен обновить трансформацию сцены с текущим rotationY', () => {
      window.rotationY = 45;
      window.updateCarousel();
      expect(stage.style.transform).toBe(`translateZ(-${400}px) rotateY(45deg)`);
    });

    test('должен корректно обрабатывать отрицательные значения rotationY', () => {
      window.rotationY = -90;
      window.updateCarousel();
      expect(stage.style.transform).toBe(`translateZ(-${400}px) rotateY(-90deg)`);
    });
  });

  describe('Цикл анимации', () => {
    test('должен увеличивать rotationY при включенной авто-ротации', () => {
      const initialRotation = window.rotationY;
      window.dragging = false;
      window.autoRotate = true;
      window.animate();
      expect(window.rotationY).toBe(initialRotation + 0.03);
    });

    test('должен применять скорость вращения, когда dragging выключен', () => {
      window.dragging = false;
      window.autoRotate = false;
      window.velocity = 1;
      window.animate();
      expect(window.rotationY).toBe(1);
      expect(window.velocity).toBe(1 * 0.95);
    });

    test('должен останавливать скорость, если она ниже порога', () => {
      window.dragging = false;
      window.autoRotate = false;
      window.velocity = 0.0005;
      window.animate();
      expect(window.velocity).toBe(0);
    });

    test('должен вызывать requestAnimationFrame', () => {
      window.animate();
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Взаимодействие с мышью', () => {
    test('mousedown должен включить dragging и отключить авто-ротацию', () => {
      const event = new window.MouseEvent('mousedown', { clientX: 100 });
      carousel.dispatchEvent(event);
      expect(window.dragging).toBe(true);
      expect(window.lastX).toBe(100);
      expect(window.velocity).toBe(0);
      expect(window.autoRotate).toBe(false);
    });

    test('mousemove должен обновлять rotationY и velocity при dragging', () => {
      window.dragging = true;
      window.lastX = 100;
      const event = new window.MouseEvent('mousemove', { clientX: 150 });
      window.dispatchEvent(event);
      expect(window.rotationY).toBe((150 - 100) * 0.3);
      expect(window.velocity).toBe((150 - 100) * 0.1);
      expect(window.lastX).toBe(150);
    });

    test('mousemove не должен ничего делать, если dragging выключен', () => {
      window.dragging = false;
      const initialRotation = window.rotationY;
      const event = new window.MouseEvent('mousemove', { clientX: 150 });
      window.dispatchEvent(event);
      expect(window.rotationY).toBe(initialRotation);
      expect(window.velocity).toBe(0);
    });

    test('mouseup должен отключить dragging и включить авто-ротацию', () => {
      window.dragging = true;
      const event = new window.MouseEvent('mouseup');
      window.dispatchEvent(event);
      expect(window.dragging).toBe(false);
      expect(window.autoRotate).toBe(true);
    });
  });

  describe('Взаимодействие с сенсорным экраном', () => {
    test('touchstart должен включить dragging и отключить авто-ротацию', () => {
      const event = new window.TouchEvent('touchstart', {
        touches: [{ clientX: 200 }],
      });
      carousel.dispatchEvent(event);
      expect(window.dragging).toBe(true);
      expect(window.lastX).toBe(200);
      expect(window.velocity).toBe(0);
      expect(window.autoRotate).toBe(false);
    });

    test('touchmove должен обновлять rotationY и velocity при dragging', () => {
      window.dragging = true;
      window.lastX = 200;
      const event = new window.TouchEvent('touchmove', {
        touches: [{ clientX: 250 }],
      });
      window.dispatchEvent(event);
      expect(window.rotationY).toBe((250 - 200) * 0.3);
      expect(window.velocity).toBe((250 - 200) * 0.1);
      expect(window.lastX).toBe(250);
    });

    test('touchmove не должен ничего делать, если dragging выключен', () => {
      window.dragging = false;
      const initialRotation = window.rotationY;
      const event = new window.TouchEvent('touchmove', {
        touches: [{ clientX: 250 }],
      });
      window.dispatchEvent(event);
      expect(window.rotationY).toBe(initialRotation);
      expect(window.velocity).toBe(0);
    });

    test('touchend должен отключить dragging и включить авто-ротацию', () => {
      window.dragging = true;
      const event = new window.TouchEvent('touchend');
      window.dispatchEvent(event);
      expect(window.dragging).toBe(false);
      expect(window.autoRotate).toBe(true);
    });
  });

  describe('Краевые случаи', () => {
    test('должен корректно обрабатывать один слайд', () => {
      // Удаляем все слайды, кроме одного
      while (stage.children.length > 1) {
        stage.removeChild(stage.lastChild);
      }
      window.setupCarousel();
      expect(window.theta).toBe(360); // 360 / 1 слайд
      expect(stage.children[0].style.transform).toBe(`rotateY(0deg) translateZ(400px)`);
    });

    test('не должен выбрасывать ошибки при отсутствии слайдов', () => {
      // Удаляем все слайды
      while (stage.children.length > 0) {
        stage.removeChild(stage.lastChild);
      }
      expect(() => window.setupCarousel()).not.toThrow();
      expect(window.theta).toBe(Infinity); // 360 / 0
    });

    test('должен корректно обрабатывать большое deltaX в mousemove', () => {
      window.dragging = true;
      window.lastX = 0;
      const event = new window.MouseEvent('mousemove', { clientX: 1000 });
      window.dispatchEvent(event);
      expect(window.rotationY).toBe(1000 * 0.3);
      expect(window.velocity).toBe(1000 * 0.1);
    });

    test('должен корректно обрабатывать быстрые touchmove события', () => {
      window.dragging = true;
      window.lastX = 200;
      const event1 = new window.TouchEvent('touchmove', { touches: [{ clientX: 250 }] });
      const event2 = new window.TouchEvent('touchmove', { touches: [{ clientX: 300 }] });
      window.dispatchEvent(event1);
      window.dispatchEvent(event2);
      expect(window.rotationY).toBe((250 - 200 + 300 - 250) * 0.3);
      expect(window.velocity).toBe((300 - 250) * 0.1);
    });
  });
});