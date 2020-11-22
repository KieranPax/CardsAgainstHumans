let socket = io();
let vue_root;

generate_templates()

function ready() {
    let room_init = new URL(window.location.href).searchParams.get('room');

    vue_root = new Vue({
        el: '#main-page',
        data: {
            login_values: {
                room: room_init ? room_init : '',
                response: ''
            },
            logged_in: false,
            chat: [],
            this_user: 0,
            users: {},
            game: {},
            this_game: {
                card_holder_scroll: 0,
                selected_white: true,
                continued: false
            }
        },
        methods: {
            curr_user() {
                return this.users[this.this_user]
            },
            login_response(response) {
                this.login_values.response = response
            },
            add_chat(data) {
                this.chat.unshift(data);
            },
            select_card(card) {
                if (this.game.state === 1) {
                    socket.emit('game-state', ['curr_black', card])
                } else if (this.game.state === 2) {
                    let user = this.curr_user()
                    for (let i = 0; i < user.cards.length; i++) {
                        if (card.id == user.cards[i].id) {
                            if (user.card_selection.length === this.game.curr_black.count) {
                                return;
                            }
                            user.card_selection.push(card);
                            user.cards.splice(i, 1);
                            return;
                        }
                    }
                    for (let i = 0; i < user.card_selection.length; i++) {
                        if (card.id == user.card_selection[i].id) {
                            user.cards.push(card);
                            user.card_selection.splice(i, 1);
                            return;
                        }
                    }

                } else if (this.game.state === 4) {
                    socket.emit('game-state', ['winner_card', card])
                } else {
                    console.log(card);
                }
            },
            finalize_select_white() {
                this.this_game.selected_white = true;
                socket.emit('game-state', ['white_cards', {
                    card_selection: this.curr_user().card_selection,
                    cards: this.curr_user().cards
                }]);
            },
            nextshowcase() {
                socket.emit('game-state', ['curr_white_disp', this.game.curr_white_disp + 1])
            },
            update_state(data) {
                console.log(data.game);

                if (this.game.state !== data.game.state) {
                    this.this_game.continued = false;

                    console.log('%cNew Game State : ' + data.game.state, "background: #bb0000")

                    if (data.game.state === 1) {
                        console.log(data.game.curr_czar, this.this_user)

                    } else if (data.game.state === 2) {
                        this.this_game.selected_white = data.game.curr_czar === this.this_user;

                    } else if (data.game.state === 3) {
                        data.game.white_cards.forEach(item => {
                            item.visible = false;
                        });
                    }
                } else {
                    if (this.game.state === 2) {
                        data.users[this.this_user].cards = this.curr_user().cards;
                        data.users[this.this_user].card_selection = this.curr_user().card_selection;
                    }
                }

                this.game = data.game;
                this.users = data.users;
            },
            continue () {
                this.this_game.continued = true;
                socket.emit('game-state', ['continue', this.game.continue+1])
            }
        }
    });
}
ready();

socket.on('login-response', data => {
    console.log('hey')
    if (data.status) {
        vue_root.this_user = data.this_user;
        vue_root.logged_in = true;

        vue_root.update_state(data)
    } else {
        vue_root.login_response(data.response)
    }
})
socket.on('chat', data => {
    data = {
        ...data,
        time: new Date(data.time)
    }
    vue_root.add_chat(data)
})
socket.on('game-state', data => {
    console.log(data)
    vue_root.update_state(data)
})

function login_submit(e) {
    e.preventDefault()
    socket.emit('login', {
        room: $('#room-input').val(),
        user: $('#username-input').val() || 'user-' + Math.round(Math.random() * 10000)
    });
}

function chat_submit(e) {
    e.preventDefault()
    let data = {
        msg: $('#chat-input').val(),
        time: new Date(),
        user: vue_root.users[vue_root.this_user]
    };
    socket.emit('chat', data);
    $('#chat-input').val('')
}