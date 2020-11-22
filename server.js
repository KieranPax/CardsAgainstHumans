// --------------------------- Imports ----------------------------------------------

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let {
    shuffle_cards,
    get_white_cards,
    get_black_cards
} = require('./cards.js')


// --------------------------- Express Config ---------------------------------------

app.use(express.static('public'));

// --------------------------- Routing ----------------------------------------------

app.get('/', function (req, res) {
    console.log('page opened')
    res.sendFile(__dirname + '/public/index.html');
});

// --------------------------- Rooms ------------------------------------------------

let rooms = {

}

function clean_rooms() {
    let empty = []
    for (let room in rooms) {
        if (Object.keys(rooms[room].user_list).length === 0) {
            empty.push(room);
        }
    }
    empty.forEach(item => {
        delete rooms[item]
        console.log('clearing room ' + item)
    })
}

function new_room(room_name) {
    rooms[room_name] = {
        name: room_name,
        user_list: {},
        user_ids: {},
        game_state: {
            state: 0,
            curr_czar: 0,
            continue: 0,
            timer: false,

            av_black: [],
            curr_black: false,
            white_cards: [],
            winner_card: false,
            curr_white_disp: 0
        }
    }
}

function distribute_cards(room_id) {
    for (let userid in rooms[room_id].user_list) {
        let user = rooms[room_id].user_list[userid];
        if (user.cards.length <= 7) {
            user.cards = get_white_cards(7, user.cards)
        }
    }
}

function analyse_game_state(room_id) {
    let room = rooms[room_id];
    let user_count = Object.keys(room.user_list).length;
    let state = room.game_state;
    let new_state = {
        ...state
    };
    if (state.state === 0) { // Waiting for game to start
        if (state.continue > 0) {
            new_state.continue = 0;
            new_state.state = 1;
            new_state.av_black = get_black_cards(3);
        }
    } else if (state.state === 1) { // Czar choosing black
        if (state.curr_black) {
            new_state.state = 2;
            new_state.white_cards = [];
            distribute_cards(room_id);
        }
    } else if (state.state === 2) { // Players choosing whites
        if (state.white_cards.length == user_count - 1) {
            new_state.state = 3;
            shuffle_cards(new_state.white_cards);
            new_state.curr_white_disp = -1;
        }
    } else if (state.state === 3) { // Displaying white cards
        if (new_state.curr_white_disp == state.white_cards.length) {
            new_state.state = 4;
            new_state.winner_card = false;
        }
    } else if (state.state === 4) { // Czar choosing winner
        if (state.winner_card) {
            new_state.state = 5;
            room.user_list[state.winner_card.user].score++
        }
    } else if (state.state === 5) { // Showing winner
        if (state.continue > 0) {
            new_state.continue = 0;
            new_state.state = 6;
        }
    } else if (state.state === 6) { // Showing scoreboard
        if (state.continue === user_count) {
            new_state.continue = 0;
            new_state.state = 1;

            let i = Object.keys(room.user_list).indexOf(state.curr_czar.toString());
            if (i === Object.keys(room.user_list).length - 1) {
                new_state.curr_czar = Number(Object.keys(room.user_list)[0])
            } else {
                new_state.curr_czar = Number(Object.keys(room.user_list)[i + 1])
            }

            new_state.av_black = get_black_cards(3);
        }
    }
    rooms[room_id].game_state = new_state;
    return new_state.game_state;
}

// --------------------------- Users ------------------------------------------------
// stored in the rooms

function new_user_index(user_list) {
    let i = 0;
    while (true) {
        if (!user_list[i]) {
            return i
        }
        i++;
    }
}

function user_obj(id, name) {
    return {
        id: id,
        name: name,
        status: 0,
        score: 0,
        cards: get_white_cards(7),
        card_selection: []
    }
}


// --------------------------- Socket.io Definitions --------------------------------

io.on('connection', (socket) => {
    let socket_room, socket_user;
    console.log('new socket');

    socket.on('login', data => {
        if (!data.user || !data.room) {
            socket.emit('login-response', {
                status: false,
                response: 'Enter Valid Username and Room Code'
            });
            return;
        }
        if (socket_room) {
            socket.emit('login-response', {
                status: false,
                response: 'Already in a room - Please refresh to leave rooms'
            });
            return;
        }

        socket.join(data.room, () => {
            if (!rooms[data.room]) {
                new_room(data.room)
            }

            let this_user = new_user_index(rooms[data.room].user_list);
            rooms[data.room].user_list[this_user] = user_obj(this_user, data.user);
            rooms[data.room].user_ids[socket.id] = this_user;

            socket.emit('login-response', {
                status: true,
                this_user,
                users: rooms[data.room].user_list,
                game: rooms[data.room].game_state
            });

            socket_room = data.room
            socket_user = rooms[socket_room].user_list[this_user];

            send_game_state(socket_room, socket, false)
        });
    })
    socket.on('chat', data => {
        socket.to(socket_room).emit('chat', data)
        socket.emit('chat', data)
    })
    socket.on('disconnecting', data => {
        if (!socket_room) {
            return;
        }
        let user = rooms[socket_room].user_ids[socket.id];
        delete rooms[socket_room].user_ids[socket.id];
        delete rooms[socket_room].user_list[user];

        send_game_state(socket_room, socket, false);
        clean_rooms();
    })
    socket.on('game-state', data => {
        let r = rooms[socket_room].game_state
        if (data[0] === 'white_cards') {
            r.white_cards.push({
                user: socket_user.id,
                cards: data[1].card_selection
            })
            socket_user.card_selection = [];
            socket_user.cards = data[1].cards;
        } else {
            if (r[data[0]].length !== undefined) {
                r[data[0]].push(data[1])
            } else {
                r[data[0]] = data[1];
            }
        }

        analyse_game_state(socket_room);
        send_game_state(socket_room, socket, true)
    })
})

function send_game_state(room_id, socket, include_self) {
    socket.to(room_id).emit('game-state', {
        users: rooms[room_id].user_list,
        game: rooms[room_id].game_state
    });
    if (include_self) {
        socket.emit('game-state', {
            users: rooms[room_id].user_list,
            game: rooms[room_id].game_state
        });
    }
}

// --------------------------- Start Server -----------------------------------------

http.listen(process.env.PORT || 3000, () => {
    console.log('Server Started...');
});