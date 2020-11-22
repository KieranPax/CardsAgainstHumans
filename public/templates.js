function getTemplate(id) {
    // console.log(id)
    return document.getElementById(id + '-template').innerHTML;
}

function generate_templates() {
    Vue.component('vue-login-holder', {
        props: ['login'],
        template: getTemplate('vue-login-holder'),
        methods: {
            enter() {
                console.log(this);
            }
        }
    })

    Vue.component('vue-chat', {
        props: ['chat'],
        template: getTemplate('vue-chat'),
        methods: {}
    })

    Vue.component('vue-chat-msg', {
        props: ['msg'],
        template: getTemplate('vue-chat-msg'),
        methods: {}
    })

    Vue.component('vue-main-game-holder', {
        props: ['users'],
        template: getTemplate('vue-main-game-holder'),
        methods: {}
    })

    Vue.component('vue-user-list-item', {
        props: ['user'],
        template: getTemplate('vue-user-list-item'),
        computed: {
            is_current_user() {
                return vue_root.this_user === this.user.id
            }
        }
    })

    Vue.component('vue-user-list-status', {
        props: ['status'],
        template: getTemplate('vue-user-list-status')
    })

    Vue.component('vue-main-game', {
        props: ['users', 'game', 'this_game', 'this_user_index'],
        template: getTemplate('vue-main-game'),
        computed: {
            this_user() {
                return this.users[this.this_user_index]
            }
        }
    })

    Vue.component('vue-start-game', {
        props: ['users'],
        template: getTemplate('vue-start-game'),
        computed: {
            user_count() {
                return Object.keys(this.users).length;
            }
        },
        methods: {
            dostart(e) {
                this.$root.continue();
            }
        }
    })

    Vue.component('vue-black-card-chooser', {
        props: ['cards'],
        template: getTemplate('vue-black-card-chooser'),
        methods: {},
        components: {
            'vue-black-card': {
                props: ['card', 'nohover', 'extra_style'],
                template: getTemplate('vue-black-card'),
                methods: {
                    doclick(e) {
                        this.$root.select_card(this.card)
                    }
                },
                computed: {
                    text() {
                        return this.card.text.join('___')
                    }
                }
            }
        }
    })

    Vue.component('vue-white-card-chooser', {
        props: ['game', 'this_game', 'this_user'],
        template: getTemplate('vue-white-card-chooser'),
        methods: {
            checkscroll() {
                if (this.$el.firstChild.getBoundingClientRect().width <
                    document.getElementById('main-game').getBoundingClientRect().width) {
                    vue_root.this_game.card_holder_scroll = 0;
                    return;
                }
                if (vue_root.this_game.card_holder_scroll < 0) {
                    vue_root.this_game.card_holder_scroll = 0;
                }
                let r = this.$el.firstChild.getBoundingClientRect().width -
                    document.getElementById('main-game').getBoundingClientRect().width + 10;
                if (r < vue_root.this_game.card_holder_scroll) {
                    vue_root.this_game.card_holder_scroll = r;
                }
            },
            doscroll(e) {
                if (this.scroll == -1) {
                    return;
                }
                vue_root.this_game.card_holder_scroll += e.deltaY * 10;
                this.checkscroll();
            },
            submit_ans(e) {
                this.$root.finalize_select_white()
            }
        },
        computed: {
            scroll() {
                return vue_root.this_game.card_holder_scroll;
            }
        },
        components: {
            'vue-white-card': {
                props: ['card'],
                template: getTemplate('vue-white-card'),
                methods: {
                    doclick(e) {
                        console.log(this.card);
                        this.$root.select_card(this.card);
                    }
                }
            },
            'vue-black-card': {
                props: ['card', 'nohover', 'extra_style'],
                template: getTemplate('vue-black-card'),
                methods: {
                    doclick(e) {}
                },
                computed: {
                    text() {
                        return this.card.text.join('___')
                    }
                }
            }
        }
    })

    Vue.component('vue-card-showcase', {
        props: ['game', 'this_user'],
        template: getTemplate('vue-card-showcase'),
        methods: {
            nextcard() {
                this.$root.nextshowcase();
            }
        },
        components: {
            'vue-card-showcase-black': {
                props: ['card', 'game', 'index'],
                template: getTemplate('vue-card-showcase-black'),
                computed: {
                    text() {
                        let t = [{
                            text: this.game.curr_black.text[0],
                            type: 0
                        }];
                        for (let i = 0; i < this.game.curr_black.count; i++) {
                            t.push({
                                text: this.card.cards[i].text,
                                type: 1
                            });
                            t.push({
                                text: this.game.curr_black.text[i + 1],
                                type: 0
                            })
                        }
                        return t;
                    }
                },
                methods: {
                    doselect(e) {
                        this.$root.select_card(this.card)
                    }
                },
                components: {
                    'vue-card-showcase-text': {
                        props: ['item'],
                        template: getTemplate('vue-card-showcase-text')
                    }
                }
            }
        }
    })

    Vue.component('vue-winner-display', {
        props: ['game', 'users', 'this_user'],
        template: getTemplate('vue-winner-display'),
        methods: {
            docontinue(e) {
                this.$root.continue()
            }
        },
        components: {
            'vue-winner-black-card': {
                props: ['game'],
                template: getTemplate('vue-winner-black-card'),
                computed: {
                    text() {
                        let t = [{
                            text: this.game.curr_black.text[0],
                            type: 0
                        }];
                        for (let i = 0; i < this.game.curr_black.count; i++) {
                            t.push({
                                text: this.game.winner_card.cards[i].text,
                                type: 1
                            });
                            t.push({
                                text: this.game.curr_black.text[i + 1],
                                type: 0
                            })
                        }
                        return t;
                    }
                },
                components: {
                    'vue-card-showcase-text': {
                        props: ['item'],
                        template: getTemplate('vue-card-showcase-text')
                    }
                }
            }
        }
    })

    Vue.component('vue-scoreboard', {
        props: ['users', 'this_user', 'this_game'],
        template: getTemplate('vue-scoreboard'),
        computed: {
            scores() {
                let scores = [];
                for (let user in this.users) {
                    scores.push({
                        user: this.users[user],
                        score: this.users[user].score,
                        place: 0
                    })
                }
                scores.sort((a, b) => b.score - a.score);
                let last;
                for (let s in scores) { // acknowledge repeats
                    if (last) {
                        if (scores[s].score === 0){
                            scores[s].place = -1
                        } else if (scores[s].score === last.score) {
                            scores[s].place = last.place
                        } else {
                            scores[s].place = last.place + 1
                        }
                    }
                    last = scores[s]
                }
                return scores;
            }
        },
        methods:{
            doready(e){
                this.$root.continue()
            }
        },
        components: {
            'vue-scoreboard-item': {
                props: ['score'],
                template: getTemplate('vue-scoreboard-item'),
                methods: {
                    place_str(place) {
                        if (place === -1) {
                            return ' - '
                        } else if (place === 0) {
                            return '1st'
                        } else if (place === 1) {
                            return '2nd'
                        } else if (place === 2) {
                            return '3rd'
                        } else {
                            return place + 1 + 'th'
                        }
                    },
                    place_class(place){
                        if (place === -1) {
                            return 'place-none'
                        } else if (place === 0) {
                            return 'place-0'
                        } else if (place === 1) {
                            return 'place-1'
                        } else if (place === 2) {
                            return 'place-2'
                        } else {
                            return 'place-last'
                        }
                    }
                }
            }
        }
    })
}