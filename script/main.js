let gameTick = 0;
let stagingType = 0;
let activeBlock = {
    type: -1,
    coords: [[{x: 0, y: 0}]], orientation: 1
};


// [[{filled: 1, div: div}][]]
const gameScreen = [];
let pause = false;

main();

function main() {
    window.onload = () => {
        initializeGameScreen();
        document.querySelector("#pause")
            .addEventListener("click", () => pause = !pause);
    }
    document.onkeydown = handleArrowKeys;


    setInterval(gameLoop, 1000)
}

function gameLoop() {
    if (!pause) {
        if (stagingType === 0) {
            // stagingType = Math.floor(Math.random() * 7) + 1;
            stagingType = 4;
        }

        if (activeBlock.type === -1) {
            initiateNewGameBlock();
            stagingType = 0;
        }

        moveDown();
        renderScreen();
        gameTick++;
    }
}

function handleArrowKeys(e) {
    switch (e.key) {
        case "ArrowLeft":
            moveSideways(-1);
            renderScreen();
            break;
        case "ArrowRight":
            moveSideways(1);
            renderScreen();
            break;
        case "ArrowUp":
            rotate();
            renderScreen();
            break;
        case "ArrowDown":
            moveDown();
            renderScreen();
            break;
    }

}

function initializeGameScreen() {
    const gameScreenDiv = document.querySelector('.tetris-view');
    Array.from(Array(20).keys()).forEach((val, index) => {
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

function createDivWithClass(className) {
    const rowDiv = document.createElement('div');
    rowDiv.className = className;
    return rowDiv;
}

function moveSideways(horizontalStep) {
    let canMove = true;
    console.log('moveSideWays', activeBlock)
    for (let i = activeBlock.coords.length - 1; i >= 0; i--) {
        const row = activeBlock.coords[i];
        let block = horizontalStep === 1 ? row[row.length - 1] : row[0];
        const newX = block.x + horizontalStep;
        console.log('new x', newX);
        if (newX > 9 || newX < 0) {
            canMove = false;
            break;
        }
        if (block.y >= 0) {
            console.log(block)
            const row = gameScreen[block.y];
            const blockElement = row[newX];
            if (blockElement.filled === 1) {
                canMove = false;
                break;
            }
        }
    }

    if (canMove && activeBlock.type !== -1) {
        console.log('cam move sideways', activeBlock)
        for (let i = activeBlock.coords.length - 1; i >= 0; i--) {
            const slice = activeBlock.coords[i].slice();

            if (horizontalStep > 0) {
                slice.reverse();
            }

            slice.forEach(block => {
                if (block.y >= 0) {
                    gameScreen[block.y][block.x].filled = 0;
                    block.x += horizontalStep;
                    gameScreen[block.y][block.x].filled = 1;
                    console.log(block.y, block.x);
                } else {
                    block.x += horizontalStep;
                }
            })
        }
    }
}

function blockIsCompared(booleanCallback) {
    return activeBlock.coords.some(row => row.some(block => booleanCallback(block)));
}

function rotate() {
    const length = activeBlock.coords.length;
    const map = activeBlock.coords.map(row => row.length);
    const max = Math.max(...map, length);
    const minX = Math.min(...activeBlock.coords.flatMap(row => row.map(block => block.x)));
    let canTurn = true;

    activeBlock.coords.forEach(row => row.forEach(block => {
        if (canTurn) {
            const xOld = block.x;
            const yOld = block.y;

            const maxPos = minX + (max - 1);
            if (minX >= 0 && maxPos <= 9) {
                // noinspection JSSuspiciousNameCombination
                const yNew = xOld;
                const xNew = minX + (maxPos - yOld);
                console.log({maxPos: maxPos, minPos: minX});
                const blockElement = gameScreen[yNew][xNew];
                if (!blockIsCompared(block => block.x === xNew && block.y === yNew)) {
                    console.log(`yOld: ${yOld}, xOld: ${xOld} | yNew: ${yNew}, xNew: ${xNew}`)
                    canTurn = blockElement.filled !== 1
                }
            } else {
                canTurn = false;
            }
        }

    }))

    if (canTurn) {
        activeBlock.coords.forEach(row => row.forEach(block => {
            const xOld = block.x;
            const yOld = block.y;

            const maxPos = minX + (max - 1);

            // noinspection JSSuspiciousNameCombination
            const yNew = xOld;
            const xNew = minX + (maxPos - yOld);

            if (yOld >= 0) {
                gameScreen[yOld][yNew].filled = 0;
            }
            if (yNew >= 0) {
                gameScreen[yNew][xNew].filled = 1;
            }
            console.log({xNew: xNew, xOld: xOld})
            block.x = xNew;
            block.y = yNew;
        }));
    }
}

function initiateNewGameBlock() {
    activeBlock.type = stagingType;
    activeBlock.coords = getStartCoordsForType(stagingType)
    activeBlock.orientation = 1;
}

function resetActiveBlock() {
    activeBlock.type = -1;
}

function moveDown() {
    let invalidMove = false;
    const figureRowCount = activeBlock.coords.length - 1;
    for (let i = figureRowCount; i >= 0; i--) {
        const figureRow = activeBlock.coords[i];

        figureRow.forEach((position, index) => {
            const newY = position.y + 1;
            if (newY >= 0 && !invalidMove) {
                invalidMove = newY >= gameScreen.length;

                if (!invalidMove) {
                    const isSelf = blockIsCompared(block => block.x === position.x
                        && block.y === newY);
                    if (i === figureRowCount) {
                        if (!isSelf) {
                            invalidMove = gameScreen[newY][position.x].filled === 1;
                        }
                    } else {
                        const blockBelow = activeBlock.coords[i + 1]
                            .some(blockCoordinates => blockCoordinates.x === position.x
                                && blockCoordinates.y === newY);
                        if (!blockBelow) {
                            if (!isSelf) {
                                invalidMove = gameScreen[newY][position.x].filled === 1;
                            }
                        }
                    }
                }
                if (invalidMove) {
                    console.log('Hitting end of board, or other block');
                    resetActiveBlock();
                }
            }
        });
    }

    if (!invalidMove) {
        for (let i = figureRowCount; i >= 0; i--) {
            const figureRow = activeBlock.coords[i];
            figureRow.forEach((position, index) => {
                const newY = position.y + 1;

                let count = 0;
                activeBlock.coords.some(row => row.some(block => {
                    if(block.x === position.x && block.y === position.y)
                        count++;
                }));

                if (position.y >= 0 && count <= 1) {
                    gameScreen[position.y][position.x].filled = 0
                }
                if (newY >= 0) {
                    gameScreen[newY][position.x].filled = 1;
                }
                position.y = newY;
            });
        }
    }
}

function renderScreen() {
    gameScreen.forEach(row => {
        row.forEach(block => {
            if (block.filled === 1) {
                block.div.className = 'tetris-block filled'
            } else {
                block.div.className = 'tetris-block'
            }
        })
    })
}

function getStartCoordsForType(stagingType) {
    let returnValue = [];
    switch (stagingType) {
        case 1:
            // #
            // #
            // #
            // #
            returnValue = [[{x: 5, y: -4}], [{x: 5, y: -3}], [{x: 5, y: -2}], [{x: 5, y: -1}]];
            break
        case 2:
            // #
            // #
            // ##
            returnValue = [[{x: 5, y: -3}], [{x: 5, y: -2}], [{x: 5, y: -1}, {x: 6, y: -1}]];
            break;
        case 3:
            //  #
            //  #
            // ##
            returnValue = [[{x: 5, y: -3}], [{x: 5, y: -2}], [{x: 4, y: -1}, {x: 5, y: -1}]]
            break;
        case 4:
            // ##
            // ##
            returnValue = [[{x: 5, y: -2}, {x: 6, y: -2}], [{x: 5, y: -1}, {x: 6, y: -1}]]
            break;
        case 5:
            // ##
            //  ##
            returnValue = [[{x: 5, y: -2}, {x: 6, y: -2}], [{x: 6, y: -1}, {x: 7, y: -1}]]
            break;
        case 6:
            //  ##
            // ##
            returnValue = [[{x: 6, y: -2}, {x: 7, y: -2}], [{x: 5, y: -1}, {x: 6, y: -1}]]
            break;
        case 7:
            // #
            // ##
            // #
            returnValue = [[{x: 5, y: -3}], [{x: 5, y: -2}, {x: 6, y: -2}], [{x: 6, y: -1}]];
            break;
    }
    console.log('new type', stagingType);
    return returnValue;
}
