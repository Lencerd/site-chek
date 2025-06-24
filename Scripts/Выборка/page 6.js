    const toolDescriptions = {
      'бетон': {
        text: 'Бетоносмеситель – для создания прочных фундаментов современных зданий',
        image: '../png/Картинки для 6 страницы/Чем строим/Бетономешалка.png'
      },
      'лазер': {
        text: 'Лазерный уровень – для точной разметки и выравнивания при строительстве',
        image: '../png/Картинки для 6 страницы/Чем строим/Лазерный уровень.png'
      },
      'краска': {
        text: 'Краска для фасадов – для защиты и эстетичного оформления зданий',
        image: '../png/Картинки для 6 страницы/Чем строим/Краска.png'
      },
      'дрель': {
        text: 'Электродрель – для выполнения монтажных и отделочных работ',
        image: '../png/Картинки для 6 страницы/Чем строим/Электродрель.png'

      }
    };
    const select = document.getElementById('toolSelect');
    const info = document.getElementById('toolInfo');
    select.addEventListener('change', () => {
      const tool = toolDescriptions[select.value];
      info.innerHTML = `<span>${tool.text}</span><img src="${tool.image}" alt="${select.value}">`;
    });
    const initialTool = toolDescriptions[select.value];
    info.innerHTML = `<span>${initialTool.text}</span><img src="${initialTool.image}" alt="${select.value}">`;
