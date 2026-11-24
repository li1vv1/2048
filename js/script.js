const main = document.createElement('main');
main.className = 'game';

const title = document.createElement('h1');
title.className = 'game__title';
title.textContent = 'Новогодняя 2048';

const score = document.createElement('p');
score.className = 'game__score';
score.textContent = 'Счёт: ';

const scoreValue = document.createElement('span');
scoreValue.textContent = '0';

score.append(scoreValue);

const board = document.createElement('div');
board.className = 'game__board';

for (let index = 0; index < 16; index++) {
  const cell = document.createElement('div');
  cell.className = 'game__cell';
  board.append(cell);
}
main.append(title, score, board);
document.body.append(main);