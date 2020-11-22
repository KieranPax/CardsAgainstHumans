const fs = require('fs');

let cards = {
    white: [],
    black: []
};

function load_cards() {
    cards.white = fs.readFileSync('files/white.cards', {
        encoding: 'utf8'
    }).split('\n')
    cards.black = fs.readFileSync('files/black.cards', {
        encoding: 'utf8'
    }).split('\n')

    for (let i = 0; i < cards.white.length; i++) {
        cards.white[i] = {
            text: cards.white[i],
            id: i
        };
    }
    for (let i = 0; i < cards.black.length; i++) {
        let l = cards.black[i].split('_');
        if (l.length === 1) {
            l[0] += '  '
            l.push('');
        }
        cards.black[i] = {
            text: l,
            count: l.length - 1,
            id: i
        };
    }
}

load_cards()

exports.get_white_card = function () {
    return cards.white[Math.floor(Math.random() * cards.white.length)]
}

exports.get_black_card = function () {
    return cards.black[Math.floor(Math.random() * cards.black.length)]
}

exports.get_white_cards = function (count, other) {
    let l = [];
    if (other) {
        l = other;
    }
    while (l.length < count) {
        let c = exports.get_white_card(),
            fail = false;
        l.forEach(item => {
            if (item.id === c.id) {
                fail = true;
            }
        })
        if (!fail) {
            l.push(c);
        }
    }
    return l
}

exports.get_black_cards = function (count) {
    let l = [];
    while (l.length < count) {
        let c = exports.get_black_card(),
            fail = false;
        l.forEach(item => {
            if (item.id === c.id) {
                fail = true;
            }
        })
        if (!fail) {
            l.push(c);
        }
    }
    return l
}


exports.shuffle_cards = function (c) {
    let nn = Math.random() * 4 + 1;
    for (let i = 0; i < c.length * nn; i++) {
        let a = Math.floor(Math.random() * c.length),
            b = Math.floor(Math.random() * c.length);
        let temp = c[a];
        c[a] = c[b];
        c[b] = temp;
    }
}