const main = document.createElement("main");
main.className = "game";
document.body.append(main);

const title = document.createElement("h1");
title.textContent = "Новогодняя 2048";
title.className = "game__title";
main.append(title);

const score = document.createElement("p");
score.textContent = "Счёт: ";
score.className = "game__score";

const scoreValue = document.createElement("span");
scoreValue.textContent = "0";

score.append(scoreValue);
main.append(score);

const actions = document.createElement("div");
actions.className = "game__actions";
main.append(actions);

const restartButton = document.createElement("button");
restartButton.textContent = "Новая игра";
restartButton.type = "button";
restartButton.className = "game__button";

const undoButton = document.createElement("button");
undoButton.textContent = "Отменить ход";
undoButton.type = "button";
undoButton.className = "game__button";
undoButton.disabled = true;

const recordsButton = document.createElement("button");
recordsButton.textContent = "Рекорды";
recordsButton.type = "button";
recordsButton.className = "game__button";

actions.append(restartButton, undoButton, recordsButton);

const board = document.createElement("div");
board.className = "game__board";
main.append(board);

for (let index = 0; index < 16; index++) {
    const cell = document.createElement("div");
    cell.className = "game__cell";
    board.append(cell);
}