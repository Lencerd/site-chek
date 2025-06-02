const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Загружаем скрипт с toolDescriptions и обработчиками событий
const toolScript = `
  const toolDescriptions = {
    'бетономешалка': {
      text: 'Бетономешалка – для массового производства бетона в строительстве заводов и жилых домов.',
      image: '../png/Картинки для 5 страницы/Чем строим/Бетономешалка.png'
    },
    'краска': {
      text: 'Краска для фресок – для создания пропагандистских изображений на общественных зданиях.',
      image: '../png/Картинки для 5 страницы/Чем строим/Краска.png'
    },
    'арматура': {
      text: 'Арматура – металлические стержни для усиления железобетонных конструкций.',
      image: '../png/Картинки для 5 страницы/Чем строим/Арматура.png'
    },
    'кран': {
      text: 'Башенный кран – для подъёма тяжёлых материалов на крупных стройках.',
      image: '../png/Картинки для 5 страницы/Чем строим/Кран.png'
    }
  };
  const select = document.getElementById('toolSelect');
  const info = document.getElementById('toolInfo');
  select.addEventListener('change', () => {
    const tool = toolDescriptions[select.value];
    info.innerHTML = \`<span>\${tool.text}</span><img src="\${tool.image}" alt="\${select.value}">\`;
  });
  const initialTool = toolDescriptions[select.value];
  info.innerHTML = \`<span>\${initialTool.text}</span><img src="\${initialTool.image}" alt="\${select.value}">\`;
`;

// Настраиваем JSDOM с элементами select и toolInfo
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
  <body>
    <select id="toolSelect">
      <option value="бетономешалка">Бетономешалка</option>
      <option value="краска">Краска</option>
      <option value="арматура">Арматура</option>
      <option value="кран">Кран</option>
    </select>
    <div id="toolInfo"></div>
  </body>
  </html>
`, { runScripts: 'dangerously', resources: 'usable' });

const { window } = dom;
global.document = window.document;
global.window = window;

// Мокаем console.error для отслеживания ошибок
console.error = jest.fn();

// Вставляем скрипт в JSDOM
const scriptEl = window.document.createElement('script');
scriptEl.textContent = toolScript;
window.document.body.appendChild(scriptEl);

describe('Тесты для новой функциональности toolDescriptions', () => {
  let select, info;

  beforeEach(() => {
    // Инициализируем элементы и сбрасываем моки
    select = document.getElementById('toolSelect');
    info = document.getElementById('toolInfo');
    jest.clearAllMocks();
    // Устанавливаем начальное значение и запускаем инициализацию
    select.value = 'бетономешалка';
    window.dispatchEvent(new window.Event('load'));
  });

  describe('Инициализация', () => {
    test('должен корректно инициализировать toolInfo с начальным значением', () => {
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['бетономешалка'].text}</span>` +
        `<img src="${toolDescriptions['бетономешалка'].image}" alt="бетономешалка">`
      );
    });

    test('должен корректно отображать начальное значение для другого инструмента', () => {
      select.value = 'краска';
      window.dispatchEvent(new window.Event('load'));
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['краска'].text}</span>` +
        `<img src="${toolDescriptions['краска'].image}" alt="краска">`
      );
    });
  });

  describe('Обработка события change', () => {
    test('должен обновлять toolInfo при изменении выбора', () => {
      select.value = 'арматура';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['арматура'].text}</span>` +
        `<img src="${toolDescriptions['арматура'].image}" alt="арматура">`
      );
    });

    test('должен корректно обрабатывать последовательные изменения выбора', () => {
      select.value = 'кран';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['кран'].text}</span>` +
        `<img src="${toolDescriptions['кран'].image}" alt="кран">`
      );
      select.value = 'бетономешалка';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['бетономешалка'].text}</span>` +
        `<img src="${toolDescriptions['бетономешалка'].image}" alt="бетономешалка">`
      );
    });
  });

  describe('Краевые случаи', () => {
    test('должен не ломаться при отсутствии toolInfo', () => {
      info.remove();
      select.value = 'кран';
      expect(() => select.dispatchEvent(new window.Event('change'))).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    test('должен не ломаться при отсутствии select', () => {
      select.remove();
      expect(() => window.dispatchEvent(new window.Event('load'))).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    test('должен корректно обрабатывать недопустимое значение select', () => {
      select.value = 'несуществующий';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe('');
      expect(console.error).toHaveBeenCalled();
    });

    test('должен корректно обрабатывать пустое значение select', () => {
      select.value = '';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe('');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Динамическое изменение DOM', () => {
    test('должен корректно обрабатывать добавление нового option', () => {
      const newOption = document.createElement('option');
      newOption.value = 'новый_инструмент';
      newOption.text = 'Новый инструмент';
      select.appendChild(newOption);
      toolDescriptions['новый_инструмент'] = {
        text: 'Новый инструмент для теста.',
        image: '../png/новый.png'
      };
      select.value = 'новый_инструмент';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['новый_инструмент'].text}</span>` +
        `<img src="${toolDescriptions['новый_инструмент'].image}" alt="новый_инструмент">`
      );
    });

    test('должен корректно обрабатывать удаление option', () => {
      select.value = 'арматура';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toContain('Арматура');
      select.querySelector('option[value="арматура"]').remove();
      select.value = 'арматура';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe('');
      expect(console.error).toHaveBeenCalled();
    });

    test('должен корректно обрабатывать динамическое добавление toolInfo', () => {
      info.remove();
      select.value = 'кран';
      select.dispatchEvent(new window.Event('change'));
      const newInfo = document.createElement('div');
      newInfo.id = 'toolInfo';
      document.body.appendChild(newInfo);
      select.dispatchEvent(new window.Event('change'));
      expect(newInfo.innerHTML).toBe(
        `<span>${toolDescriptions['кран'].text}</span>` +
        `<img src="${toolDescriptions['кран'].image}" alt="кран">`
      );
    });
  });

  describe('Производительность и стресс-тесты', () => {
    test('должен корректно обрабатывать множественные события change', () => {
      const tools = Object.keys(toolDescriptions);
      for (let i = 0; i < 100; i++) {
        select.value = tools[i % tools.length];
        select.dispatchEvent(new window.Event('change'));
      }
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions[tools[99 % tools.length]].text}</span>` +
        `<img src="${toolDescriptions[tools[99 % tools.length]].image}" alt="${tools[99 % tools.length]}">`
      );
    });

    test('должен сохранять стабильность при быстрых изменениях выбора', () => {
      const startTime = Date.now();
      const tools = Object.keys(toolDescriptions);
      for (let i = 0; i < 1000; i++) {
        select.value = tools[i % tools.length];
        select.dispatchEvent(new window.Event('change'));
      }
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Проверяем производительность
      expect(info.innerHTML).toContain(toolDescriptions[tools[999 % tools.length]].text);
    });
  });

  describe('Проверка содержимого toolDescriptions', () => {
    test('должен корректно отображать все инструменты из toolDescriptions', () => {
      const tools = Object.keys(toolDescriptions);
      for (const tool of tools) {
        select.value = tool;
        select.dispatchEvent(new window.Event('change'));
        expect(info.innerHTML).toBe(
          `<span>${toolDescriptions[tool].text}</span>` +
          `<img src="${toolDescriptions[tool].image}" alt="${tool}">`
        );
      }
    });

    test('должен корректно обрабатывать повреждённый объект toolDescriptions', () => {
      toolDescriptions['бетономешалка'] = { text: '', image: '' };
      select.value = 'бетономешалка';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe(`<span></span><img src="" alt="бетономешалка">`);
    });

    test('должен корректно обрабатывать отсутствие text в toolDescriptions', () => {
      toolDescriptions['краска'] = { image: toolDescriptions['краска'].image };
      select.value = 'краска';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toContain(`<span>undefined</span>`);
      expect(info.innerHTML).toContain(toolDescriptions['краска'].image);
    });

    test('должен корректно обрабатывать отсутствие image в toolDescriptions', () => {
      toolDescriptions['арматура'] = { text: toolDescriptions['арматура'].text };
      select.value = 'арматура';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toContain(toolDescriptions['арматура'].text);
      expect(info.innerHTML).toContain(`<img src="undefined" alt="арматура">`);
    });

    test('должен корректно обрабатывать toolDescriptions с некорректной структурой', () => {
      toolDescriptions['кран'] = null;
      select.value = 'кран';
      expect(() => select.dispatchEvent(new window.Event('change'))).not.toThrow();
      expect(info.innerHTML).toBe('');
      expect(console.error).toHaveBeenCalled();
    });
  });
});