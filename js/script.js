let field = Array(gameData.size * gameData.size).fill(0);
let currentScore = 0;

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

const cells = [];

for (let index = 0; index < field.length; index++) {
    const cell = document.createElement("div");
    cell.className = "game__cell";
    board.append(cell);
    cells.push(cell);
}

function addRandomTile() {
    const emptyCells = [];

    field.forEach(function (value, index) {
        if (value === 0) {
            emptyCells.push(index);
        }
    });

    if (emptyCells.length === 0) {
        return;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const cellIndex = emptyCells[randomIndex];

    const valueIndex = Math.floor(Math.random() * gameData.tileValues.length);
    field[cellIndex] = gameData.tileValues[valueIndex];
}

function renderField() {
    field.forEach(function (value, index) {
        if (value === 0) {
            cells[index].textContent = "";
        } else {
            cells[index].textContent = value;
        }
    });

    scoreValue.textContent = currentScore;
}

function moveLine(line) {
    const numbers = line.filter(function (value) {
        return value !== 0;
    });

    let index = 0;

    while (index < numbers.length - 1) {
        if (numbers[index] === numbers[index + 1]) {
            numbers[index] = numbers[index] * 2;
            currentScore = currentScore + numbers[index];
            numbers.splice(index + 1, 1);

            if (index > 0) {
                index--;
            }
        } else {
            index++;
        }
    }

    while (numbers.length < gameData.size) {
        numbers.push(0);
    }

    return numbers;
}

function moveLeft() {
    const nextField = [];

    for (let row = 0; row < gameData.size; row++) {
        const start = row * gameData.size;
        const line = field.slice(start, start + gameData.size);
        const movedLine = moveLine(line);

        nextField.push(...movedLine);
    }

    const changed = field.some(function (value, index) {
        return value !== nextField[index];
    });

    if (!changed) {
        return;
    }

    field = nextField;
    addRandomTile();
    renderField();
}

function startGame() {
    field = Array(gameData.size * gameData.size).fill(0);
    currentScore = 0;
    undoButton.disabled = true;

    for (let index = 0; index < gameData.initialTileCount; index++) {
        addRandomTile();
    }

    renderField();
}

restartButton.addEventListener("click", function () {
    startGame();
});

document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveLeft();
    }
});

startGame();