let gameTick = 0;
let stagingType = 0;
let activeBlock = {
    type: -1,
    coords: [{x: 0, y: 0}], orientation: 1
};


// [[{filled: 1, div: div}][]]
const gameScreen = [];
let pause = false;
const blockFigures = [{
    name: "long",
    type: 1,
    blocks: [
        [1],
        [1],
        [1],
        [1],
    ],
}]

main();

function main() {
    window.onload = () => {
        initializeGameScreen();
        document.querySelector("#pause")
            .addEventListener("click", () => pause = !pause);
    }
    document.onkeydown = handleArrowKeys;


    setInterval(gameLoop, 400)
}

function createDivWithClass(className) {
    const rowDiv = document.createElement('div');
    rowDiv.className = className;
    return rowDiv;
}

function initializeGameScreen() {
    const gameScreenDiv = document.querySelector('.tetris-view');
    console.log('loop')
    Array.from(Array(20).keys()).forEach((val, index) => {
        console.log('loop')
        const rowDiv = createDivWithClass('tetris-row');
        const blocks = [];
        Array.from(Array(10).keys()).forEach((block, index) => {
            const blockDiv = createDivWithClass('tetris-block');
            rowDiv.appendChild(blockDiv);
            blocks.push({filled: 0, div: blockDiv});
        });
        gameScreenDiv.appendChild(rowDiv);
        gameScreen.push(blocks);
    });
}

function moveActive(horizontalStep) {
    let canMove = true;
    console.log('moveSideWays', activeBlock)
    for (let i = activeBlock.coords.length - 1; i >= 0; i--) {

        const coord = activeBlock.coords[i];
        const newX = coord.x + horizontalStep;

        if (coord.y >= 0) {
            const row = gameScreen[coord.y];
            const block = row[newX];
            if (block.filled === 1) {
                canMove = false;
                break;
            }
        }

    }
    if (canMove && activeBlock.type !== -1) {
        console.log('cam move sideways', activeBlock)
        for (let i = activeBlock.coords.length - 1; i >= 0; i--) {
            const coord = activeBlock.coords[i];
            if (coord.y >= 0) {
                gameScreen[coord.y][coord.x].filled = 0;
                coord.x += horizontalStep;
                gameScreen[coord.y][coord.x].filled = 1;
            } else {
                coord.x += horizontalStep;
            }


        }
    }
}

function handleArrowKeys(e) {
    switch (e.key) {
        case "ArrowLeft":
            moveActive(-1);
            renderScreen();
            break;
        case "ArrowRight":
            moveActive(1);
            renderScreen();
            break;
        case "ArrowUp":
            // Up pressed
            break;
        case "ArrowDown":
            handleVerticalMovement();
            renderScreen();
            break;
    }

}

function getStartCoordsForType(stagingType) {
    switch (stagingType) {
        case 1:
            return [{x: 5, y: -4}, {x: 5, y: -3}, {x: 5, y: -2}, {x: 5, y: -1}];
    }
    return [];
}

function initiateNewGameBlock() {
    activeBlock.type = stagingType;
    activeBlock.coords = getStartCoordsForType(stagingType)
    activeBlock.orientation = 1;
}

function resetActiveBlock() {
    activeBlock.type = -1;
}

function handleVerticalMovement() {
    for (let i = activeBlock.coords.length - 1; i >= 0; i--) {
        const coord = activeBlock.coords[i];
        const newY = coord.y + 1;

        if (newY >= 0) {
            if (newY >= gameScreen.length) {
                console.log('end of game board');
                // end of game board
                resetActiveBlock();
                continue;
            }

            const row = gameScreen[newY];
            const blockElement = row[coord.x];

            console.log('gonna take a look at block element', blockElement, newY, coord.x);
            if (blockElement.filled === 1) {
                // hitting other block, full stop
                // TODO: Handle lose case
                if (i === activeBlock.coords.length - 1) {
                    console.log('hitting other block, reset');
                    resetActiveBlock();
                }
            } else {
                blockElement.filled = 1;

                if (coord.y >= 0) {
                    const oldRow = gameScreen[coord.y]
                    const oldBlockElement = oldRow[coord.x]
                    console.log('clear old position', coord)
                    oldBlockElement.filled = 0;
                }
            }
        }
        coord.y = newY;
    }
}

function renderScreen() {
    gameScreen.forEach(row => {
        row.forEach(block => {
            // console.log(block)
            if (block.filled === 1) {
                block.div.className = 'tetris-block filled'
            } else {
                block.div.className = 'tetris-block'
            }
        })
    })
}

function gameLoop() {
    if (!pause) {
        if (stagingType === 0) {
            //TODO: Fetch logic for new type
            stagingType = 1;
        }

        if (activeBlock.type === -1) {
            initiateNewGameBlock();
            stagingType = 0;
        }

        const blockFigure = blockFigures.find(block => block.type === activeBlock.type);


        handleVerticalMovement();


        renderScreen();

        gameTick++;
    }
}
