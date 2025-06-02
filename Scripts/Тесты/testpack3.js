const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Загружаем скрипт функции adjustMainPadding
const adjustMainPaddingScript = `
  function adjustMainPadding() {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const headerHeight = header.offsetHeight;
    main.style.paddingTop = \`\${headerHeight + 20}px\`;
  }

  window.addEventListener('load', adjustMainPadding);
  window.addEventListener('resize', adjustMainPadding);
`;

// Настраиваем JSDOM с элементами header и main
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
  <body>
    <header style="height: 100px;"></header>
    <main></main>
  </body>
  </html>
`, { runScripts: 'dangerously', resources: 'usable' });

const { window } = dom;
global.document = window.document;
global.window = window;

// Мокаем события load и resize
let loadEventListeners = [];
let resizeEventListeners = [];
window.addEventListener = jest.fn((event, callback) => {
  if (event === 'load') loadEventListeners.push(callback);
  if (event === 'resize') resizeEventListeners.push(callback);
});
window.dispatchEvent = jest.fn((event) => {
  if (event.type === 'load') loadEventListeners.forEach(cb => cb(event));
  if (event.type === 'resize') resizeEventListeners.forEach(cb => cb(event));
});

// Мокаем console.error для отслеживания ошибок
console.error = jest.fn();

// Вставляем скрипт в JSDOM
const scriptEl = window.document.createElement('script');
scriptEl.textContent = adjustMainPaddingScript;
window.document.body.appendChild(scriptEl);

describe('Тесты для функции adjustMainPadding', () => {
  let header, main;

  beforeEach(() => {
    // Инициализируем элементы и сбрасываем моки
    header = document.querySelector('header');
    main = document.querySelector('main');
    // Сбрасываем стили и моки
    header.style.height = '100px';
    main.style.paddingTop = '';
    jest.clearAllMocks();
    // Вызываем load-событие для начальной настройки
    window.dispatchEvent(new window.Event('load'));
  });

  describe('Инициализация при загрузке', () => {
    test('должен устанавливать paddingTop на основе высоты header при загрузке', () => {
      expect(main.style.paddingTop).toBe('120px'); // 100px + 20px
    });

    test('должен корректно обрабатывать header с другой высотой', () => {
      header.style.height = '50px';
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('70px'); // 50px + 20px
    });

    test('должен устанавливать paddingTop при нулевой высоте header', () => {
      header.style.height = '0px';
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('20px'); // 0px + 20px
    });
  });

  describe('Обработка события resize', () => {
    test('должен обновлять paddingTop при изменении размера окна', () => {
      header.style.height = '150px';
      window.dispatchEvent(new window.Event('resize'));
      expect(main.style.paddingTop).toBe('170px'); // 150px + 20px
    });

    test('должен корректно обрабатывать множественные события resize', () => {
      header.style.height = '200px';
      window.dispatchEvent(new window.Event('resize'));
      expect(main.style.paddingTop).toBe('220px');
      header.style.height = '300px';
      window.dispatchEvent(new window.Event('resize'));
      expect(main.style.paddingTop).toBe('320px');
    });

    test('должен игнорировать resize, если header не изменил высоту', () => {
      window.dispatchEvent(new window.Event('resize'));
      expect(main.style.paddingTop).toBe('120px'); // Без изменений
    });
  });

  describe('Краевые случаи', () => {
    test('должен не ломаться при отсутствии header', () => {
      header.remove();
      expect(() => window.dispatchEvent(new window.Event('load'))).not.toThrow();
      expect(main.style.paddingTop).toBe('');
      expect(console.error).toHaveBeenCalled();
    });

    test('должен не ломаться при отсутствии main', () => {
      main.remove();
      expect(() => window.dispatchEvent(new window.Event('load'))).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    test('должен корректно обрабатывать header без стиля height', () => {
      header.style.height = '';
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('20px'); // offsetHeight = 0 + 20px
    });

    test('должен корректно обрабатывать отрицательную высоту header', () => {
      header.style.height = '-10px';
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('20px'); // offsetHeight = 0 + 20px
    });
  });

  describe('Производительность и стресс-тесты', () => {
    test('должен корректно обрабатывать множественные быстрые события resize', () => {
      header.style.height = '100px';
      for (let i = 0; i < 100; i++) {
        header.style.height = `${100 + i}px`;
        window.dispatchEvent(new window.Event('resize'));
      }
      expect(main.style.paddingTop).toBe('219px'); // 199px + 20px
    });

    test('должен корректно обрабатывать длительную последовательность событий load', () => {
      header.style.height = '150px';
      for (let i = 0; i < 50; i++) {
        window.dispatchEvent(new window.Event('load'));
      }
      expect(main.style.paddingTop).toBe('170px'); // 150px + 20px
    });

    test('должен сохранять стабильность при частых изменениях высоты header', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        header.style.height = `${100 + (i % 100)}px`;
        window.dispatchEvent(new window.Event('resize'));
      }
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Проверяем производительность
      expect(main.style.paddingTop).toBe(`${100 + (999 % 100) + 20}px`);
    });
  });

  describe('Проверка стилей и совместимости', () => {
    test('должен корректно обрабатывать header с дробной высотой', () => {
      header.style.height = '100.5px';
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('120.5px'); // 100.5px + 20px
    });

    test('должен игнорировать некорректные значения стиля paddingTop', () => {
      main.style.paddingTop = 'invalid';
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('120px'); // Перезаписывает некорректный стиль
    });

    test('должен корректно работать с динамически добавленным header', () => {
      header.remove();
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('');
      const newHeader = document.createElement('header');
      newHeader.style.height = '200px';
      document.body.appendChild(newHeader);
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('220px'); // 200px + 20px
    });

    test('должен корректно работать с динамически добавленным main', () => {
      main.remove();
      window.dispatchEvent(new window.Event('load'));
      const newMain = document.createElement('main');
      document.body.appendChild(newMain);
      window.dispatchEvent(new window.Event('load'));
      expect(newMain.style.paddingTop).toBe('120px'); // 100px + 20px
    });
  });

  describe('Обработка событийной последовательности', () => {
    test('должен корректно обрабатывать последовательность load и resize', () => {
      header.style.height = '100px';
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('120px');
      header.style.height = '200px';
      window.dispatchEvent(new window.Event('resize'));
      expect(main.style.paddingTop).toBe('220px');
    });

    test('должен корректно обрабатывать resize после удаления header', () => {
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('120px');
      header.remove();
      window.dispatchEvent(new window.Event('resize'));
      expect(main.style.paddingTop).toBe('');
      expect(console.error).toHaveBeenCalled();
    });

    test('должен корректно обрабатывать load после изменения стилей', () => {
      main.style.paddingTop = '50px';
      header.style.height = '300px';
      window.dispatchEvent(new window.Event('load'));
      expect(main.style.paddingTop).toBe('320px'); // 300px + 20px
    });
  });
});