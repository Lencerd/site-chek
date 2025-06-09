const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Загружаем скрипт с toolDescriptions и обработчиками событий
const toolScript = `
  const toolDescriptions = {
    'мастерок': {
      text: 'Штукатурный мастерок – незаменимый инструмент для нанесения штукатурки на стены дворцов и храмов Российской Империи. Использовался для создания гладких поверхностей под росписи и декор.',
      image: '../png/Картинки для 4 страницы/Чем строим/Штукатурный мастерок.png'
    },
    'кисть': {
      text: 'Кисть для позолоты – применялась для нанесения тонких слоев сусального золота на декоративные элементы интерьеров и фасадов. Требовала высокой точности и мастерства.',
      image: '../png/Картинки для 4 страницы/Чем строим/Кисть для позолоты.png'
    },
    'уровень': {
      text: 'Уровень – инструмент для выверки горизонтальных и вертикальных линий при возведении симметричных фасадов. Обеспечивал идеальную геометрию классицистических зданий.',
      image: '../png/Картинки для 4 страницы/Чем строим/Уровень.png'
    },
    'молоток': {
      text: 'Молоток резчика – использовался для обработки декоративных элементов из камня и дерева. Мастера создавали сложные орнаменты для колонн и карнизов.',
      image: '../png/Картинки для 4 страницы/Чем строим/Молоток резчика.png'
    },
    'линейка': {
      text: 'Линейка – применялась архитекторами для точных измерений и чертежей. Обеспечивала пропорциональность в классицизме и барокко Российской Империи.',
      image: '../png/Картинки для 4 страницы/Чем строим/Линейка.png'
    },
    'резец': {
      text: 'Резец по камню – использовался для тонкой обработки мрамора и гранита, создания скульптур и декоративных рельефов на фасадах зданий.',
      image: '../png/Картинки для 4 страницы/Чем строим/Резец по камню.png'
    },
    'шпатель': {
      text: 'Шпатель для декора – применялся для нанесения тонких слоев штукатурки и создания текстурных узоров на стенах дворцов и усадеб.',
      image: '../png/Картинки для 4 страницы/Чем строим/Шпатель.png'
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
      <option value="мастерок">Мастерок</option>
      <option value="кисть">Кисть</option>
      <option value="уровень">Уровень</option>
      <option value="молоток">Молоток</option>
      <option value="линейка">Линейка</option>
      <option value="резец">Резец</option>
      <option value="шпатель">Шпатель</option>
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

describe('Тесты для функциональности toolDescriptions', () => {
  let select, info;

  beforeEach(() => {
    // Инициализируем элементы и сбрасываем моки
    select = document.getElementById('toolSelect');
    info = document.getElementById('toolInfo');
    jest.clearAllMocks();
    // Устанавливаем начальное значение и запускаем инициализацию
    select.value = 'мастерок';
    window.dispatchEvent(new window.Event('load')); // Имитация загрузки для инициализации
  });

  describe('Инициализация', () => {
    test('должен корректно инициализировать toolInfo с начальным значением', () => {
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['мастерок'].text}</span>` +
        `<img src="${toolDescriptions['мастерок'].image}" alt="мастерок">`
      );
    });

    test('должен корректно отображать начальное значение для другого инструмента', () => {
      select.value = 'кисть';
      window.dispatchEvent(new window.Event('load'));
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['кисть'].text}</span>` +
        `<img src="${toolDescriptions['кисть'].image}" alt="кисть">`
      );
    });
  });

  describe('Обработка события change', () => {
    test('должен обновлять toolInfo при изменении выбора', () => {
      select.value = 'уровень';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['уровень'].text}</span>` +
        `<img src="${toolDescriptions['уровень'].image}" alt="уровень">`
      );
    });

    test('должен корректно обрабатывать последовательные изменения выбора', () => {
      select.value = 'молоток';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['молоток'].text}</span>` +
        `<img src="${toolDescriptions['молоток'].image}" alt="молоток">`
      );
      select.value = 'линейка';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe(
        `<span>${toolDescriptions['линейка'].text}</span>` +
        `<img src="${toolDescriptions['линейка'].image}" alt="линейка">`
      );
    });
  });

  describe('Краевые случаи', () => {
    test('должен не ломаться при отсутствии toolInfo', () => {
      info.remove();
      select.value = 'резец';
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
      select.value = 'шпатель';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toContain('Шпатель для декора');
      select.querySelector('option[value="шпатель"]').remove();
      select.value = 'шпатель';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe('');
      expect(console.error).toHaveBeenCalled();
    });

    test('должен корректно обрабатывать динамическое добавление toolInfo', () => {
      info.remove();
      select.value = 'резец';
      select.dispatchEvent(new window.Event('change'));
      const newInfo = document.createElement('div');
      newInfo.id = 'toolInfo';
      document.body.appendChild(newInfo);
      select.dispatchEvent(new window.Event('change'));
      expect(newInfo.innerHTML).toBe(
        `<span>${toolDescriptions['резец'].text}</span>` +
        `<img src="${toolDescriptions['резец'].image}" alt="резец">`
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
      toolDescriptions['мастерок'] = { text: '', image: '' };
      select.value = 'мастерок';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toBe(`<span></span><img src="" alt="мастерок">`);
    });

    test('должен корректно обрабатывать отсутствие text в toolDescriptions', () => {
      toolDescriptions['кисть'] = { image: toolDescriptions['кисть'].image };
      select.value = 'кисть';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toContain(`<span>undefined</span>`);
      expect(info.innerHTML).toContain(toolDescriptions['кисть'].image);
    });

    test('должен корректно обрабатывать отсутствие image в toolDescriptions', () => {
      toolDescriptions['уровень'] = { text: toolDescriptions['уровень'].text };
      select.value = 'уровень';
      select.dispatchEvent(new window.Event('change'));
      expect(info.innerHTML).toContain(toolDescriptions['уровень'].text);
      expect(info.innerHTML).toContain(`<img src="undefined" alt="уровень">`);
    });
  });
});