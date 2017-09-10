'use strict';

const Width = 6, Height = 13, Size = 24;
let posA = {x: 1, y: 6}, posB = {x: 4, y: 6}, turnA = true;

const $Grids = _.range(Height).map(() => new Array(Width));
const $Paths = _.range(Height).map(() => _.range(Width).map(() => [null, null]));

const grids = new Grids({w: Width, h: Height});
grids.visit(posA, turnA);
grids.visit(posB, turnA);

jQuery($ => {
    const $tower = $("<svg>");
    const $towerView = $("#tower").attr({width: Size * 2 * Width - 4, height: Size * 2 * Height});
    $tower[0].setAttribute('viewBox', `2 0 ${Size * 2 * Width - 4} ${Size * 2 * Height}`);

    for(const j of _.range(Height)) {
        for(const i of _.range(Width)) {
            $Grids[j][i] = $("<rect>").attr({
                x: (i * 2 + 0.5) * Size, y: (j * 2 + 0.5) * Size, width: Size, height: Size,
                'data-x': i, 'data-y': j
            }).data({x: i, y: j}).addClass("grid " + "ba"[(i + j) % 2]).appendTo($tower);
        }
    }
    for(const j of _.range(Height - 1)) {
        for(const i of _.range(-1, Width)) {
            for(const k of [0,1]) {
                const $path = $("<line>").attr({
                    x1: (i * 2 + 1.5) * Size, x2: (i * 2 + 2.5) * Size,
                    y1: (j * 2 + 1.5 + k) * Size, y2: (j * 2 + 2.5 - k) * Size,
                }).addClass("path " + "ba"[(i + j + k) % 2]).appendTo($tower);
                if(i === -1) {
                    $Paths[j][Width - 1][k] = $path;
                } else if(i === Width - 1) {
                    $Paths[j][i][k] = $Paths[j][i][k].add($path);
                } else {
                    $Paths[j][i][k] = $path;
                }
            }
        }
    }

    $('#pass').click(() => { turnA = !turnA; turn(); })

    function turn() {
        const turnName = turnA ? 'a' : 'b', pos = turnA ? posA : posB;

        $tower.find(".grid").removeClass("now next");
        $Grids[posA.y][posA.x].addClass("now");
        $Grids[posB.y][posB.x].addClass("now");

        grids.nextStepCandidates(pos).forEach(({x, y}) => {
            $Grids[y][x].addClass('next');
        });

        $tower.find('.visit-num').remove();
        grids.forEach(g => {
            const $g = $Grids[g.y][g.x];
            $g.removeClass('g-0 g-1 g-2 g-3 g-4 g-5 g-6 g-7 g-8 g-9 g-10').addClass(`g-${g.group}`);
            if(g.group !== 0) {
                $g.addClass('owned');
            } else {
                $g.removeClass('owned');
            }
            if(g.visited !== 0) {
                $("<text>").text(g.visited).attr({
                    'font-size': Size,
                    x: +$g.attr('x') + Size / 2,
                    y: +$g.attr('y') + Size,
                }).addClass('visit-num').appendTo($tower);
            }
        });
        let scoreA = 0, scoreB = 0;
        grids.forEachPath(({group, y, x, isA, oldGroup}) => {
            if(group) {
                $Paths[y][x][(y + x + isA) % 2].addClass('owned');
                scoreA += isA;
                scoreB += !isA;
            } else {
                $Paths[y][x][(y + x + isA) % 2].removeClass('owned');
            }
            if(!group !== !oldGroup) {
                $Paths[y][x][(y + x + isA) % 2].addClass('recently');
            } else {
                $Paths[y][x][(y + x + isA) % 2].removeClass('recently');
            }
        });
        $("#score-a").text(scoreA);
        $("#score-b").text(scoreB);

        $towerView.html($tower.html());

        $towerView.off('click').on('click', ev => {
            const $target = $(ev.target);
            if($target.hasClass('next')) {
                const newPos = {x: $target.data('x'), y: $target.data('y')};
                if(turnA) posA = newPos;
                else      posB = newPos;
                grids.visit(newPos, turnA);
                turnA = !turnA;
                turn();
            }
            return false;
        });
    }
    turn();
});
