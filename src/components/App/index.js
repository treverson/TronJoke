import React from 'react';
import Message from 'components/Message';
import Featured from 'components/Featured';
import TronLinkGuide from 'components/TronLinkGuide';
import TronWeb from 'tronweb';
import Utils from 'utils';
import Swal from 'sweetalert2';
import banner from 'assets/banner.png';
import $ from  'jquery';

import './App.scss';
import TronLogo from './tronjoke.png';

const FOUNDATION_ADDRESS = 'TWiWt5SEDzaEqS6kE5gandWMNfxR2B5xzg';

class App extends React.Component {
    state = {
        tronWeb: {
            installed: false,
            loggedIn: false
        },
        currentMessage: {
            message: '',
            loading: false
        },
        messages: {
            recent: {},
            featured: []
        }
    }

    constructor(props) {
        super(props);

        this.onMessageEdit = this.onMessageEdit.bind(this);
        this.onMessageSend = this.onMessageSend.bind(this);
        this.onMessageTip = this.onMessageTip.bind(this);
        this.showZuixin = this.showZuixin.bind(this);
        this.showZuire = this.showZuire.bind(this);
    }

    async componentDidMount() {
        await new Promise(resolve => {
            const tronWebState = {
                installed: !!window.tronWeb,
                loggedIn: window.tronWeb && window.tronWeb.ready
            };

            if(tronWebState.installed) {
                this.setState({
                    tronWeb:
                    tronWebState
                });

                return resolve();
            }

            let tries = 0;

            const timer = setInterval(() => {
                if(tries >= 10) {
                    const TRONGRID_API = 'https://api.trongrid.io';

                    window.tronWeb = new TronWeb(
                        TRONGRID_API,
                        TRONGRID_API,
                        TRONGRID_API
                    );

                    this.setState({
                        tronWeb: {
                            installed: false,
                            loggedIn: false
                        }
                    });

                    clearInterval(timer);
                    return resolve();
                }

                tronWebState.installed = !!window.tronWeb;
                tronWebState.loggedIn = window.tronWeb && window.tronWeb.ready;

                if(!tronWebState.installed) {
                    return tries++;
                } else {
                    clearInterval(timer);
                    return resolve();
                }

                this.setState({
                    tronWeb: tronWebState
                });

                resolve();
            }, 1000);
        });

        if(!this.state.tronWeb.loggedIn) {
            // Set default address (foundation address) used for contract calls
            // Directly overwrites the address object as TronLink disabled the
            // function call
            window.tronWeb.defaultAddress = {
                hex: window.tronWeb.address.toHex(FOUNDATION_ADDRESS),
                base58: FOUNDATION_ADDRESS
            };

            window.tronWeb.on('addressChanged', () => {
                if(this.state.tronWeb.loggedIn)
                    return;

                this.setState({
                    tronWeb: {
                        installed: true,
                        loggedIn: true
                    }
                });
            });
        }

        await Utils.setTronWeb(window.tronWeb);

        this.startEventListener();
        this.fetchMessages();
    }

    // Polls blockchain for smart contract events
    startEventListener() {
        Utils.contract.MessagePosted().watch((err, { result }) => {
            if(err)
                return console.error('Failed to bind event listener:', err);

            console.log('Detected new message:', result.id);
            this.fetchMessage(+result.id);
        });
    }

    async fetchMessages() {
      const messages = await Utils.fetchMessages();
        alert(JSON.stringify(messages['recent']));
        this.setState({
            messages: messages
        });
    }

    async fetchMessage(messageID) {
        const {
            recent,
            featured,
            message
        } = await Utils.fetchMessage(messageID, this.state.messages);

        this.setState({
            messages: {
                recent,
                featured
            }
        });

        return message;
    }

    // Stores value of textarea to state
    onMessageEdit({ target: { value } }) {
        if(this.state.currentMessage.loading)
            return;

        this.setState({
            currentMessage: {
                message: value,
                loading: false
            }
        });
    }

    // Submits message to the blockchain
    onMessageSend() {
        const {
            loading,
            message
        } = this.state.currentMessage;

        if(loading)
            return;

        if(!message.trim().length)
            return;

        this.setState({
            currentMessage: {
                loading: true,
                message
            }
        });

        Utils.contract.postMessage(message).send({
            shouldPollResponse: true,
            callValue: 10000000
        }).then(res => Swal({
            title: 'Post Created',
            type: 'success'
        })).catch(err => Swal({
            title: 'Post Failed',
            type: 'error'
        })).then(() => {
            this.setState({
                currentMessage: {
                    loading: false,
                    message
                }
            });
        });
    }

    // Tips a message with a specific amount
    async onMessageTip(messageID) {
        const messages = {
            ...this.state.messages.recent,
            ...this.state.messages.featured
        };

        if(!messages.hasOwnProperty(messageID))
            return;

        if(!this.state.tronWeb.loggedIn)
            return;

        if(messages[messageID].owner === Utils.tronWeb.defaultAddress.base58)
            return;

        const { value } = await Swal({
            title: '打赏',
            text: '输入trx个数',
            confirmButtonText: '赏',
            input: 'text',
            showCancelButton: true,
            showLoaderOnConfirm: true,
            reverseButtons: true,
            allowOutsideClick: () => !Swal.isLoading(),
            allowEscapeKey: () => !Swal.isLoading(),
            preConfirm: amount => {
                if(isNaN(amount) || amount <= 0) {
                    Swal.showValidationMessage('金额格式不对');
                    return false;
                }

                return Utils.contract.tipMessage(+messageID).send({
                    callValue: Number(amount) * 1000000
                }).then(() => true).catch(err => {
                    Swal.showValidationMessage(err);
                });
            }
        });

        value && Swal({
            title: '谢爷赏!',
            type: 'success'
        });
    }

    renderMessageInput() {
        if(!this.state.tronWeb.installed)
            return <TronLinkGuide />;

        if(!this.state.tronWeb.loggedIn)
            return <TronLinkGuide installed />;

        return (
            <div className={ 'messageInput' + (this.state.currentMessage.loading ? ' loading' : '') }>
                <textarea
                    placeholder='给生活, 多一点快乐'
                    value={ this.state.currentMessage.message }
                    onChange={ this.onMessageEdit }></textarea>
                <div className='footerx'>
                    <div className='warning'>
                        发帖费用10TRX
                    </div>
                    <div className="button is-success" onClick={ this.onMessageSend }> 发帖 </div>
                </div>
            </div>
        );
    }

    showZuixin() {
        $("#tab-all").addClass("is-active");
        $("#tab-all").addClass("active");
        $("#tab-my").removeClass("is-active");
        $("#tab-my").removeClass("active");
        $("#all-content").show();
        $("#my-content").hide();
    }
      
    showZuire() {
        $("#tab-my").addClass("is-active");
        $("#tab-my").addClass("active");
        $("#tab-all").removeClass("is-active");
        $("#tab-all").removeClass("active");
        $("#my-content").show();
        $("#all-content").hide();
    }

    render() {
        const {
            recent,
            featured
        } = this.state.messages;

        const messages = Object.entries(recent).sort((a, b) => b[1].timestamp - a[1].timestamp).map(([ messageID, message ]) => (
            <Message
                message={ message }
                featured={ featured.includes(+messageID) }
                key={ messageID }
                messageID={ messageID }
                tippable={ message.owner !== Utils.tronWeb.defaultAddress.base58 }
                requiresTronLink={ !this.state.tronWeb.installed }
                onTip={ this.onMessageTip } />
        ));

        return (
          <div>
            <div className='kontainer'>
                <div className='header white'>
                    <img src={TronLogo}></img>
                    <p>
                        <strong>波场段子</strong> 是一个可以把你喜欢的段子发上来, 并获得打赏的网站。 今日补贴1000TRX。
                        <br/><br/>
                        期待你的表演~
                    </p>
                </div>

                { this.renderMessageInput() }

                <div className="tabs">
                  <ul>
                    <li className="is-active" id="tab-all" onClick={ this.showZuixin }><a>最新</a></li>
                    <li id="tab-my" className="has-text-black" onClick={ this.showZuire }><a>最热</a></li>
                  </ul>
                </div>

                <div id="my-content">
                  <div className='header'>
                    <span>按打赏排序top20</span>
                  </div>
                  <Featured
                    recent={ recent }
                    featured={ featured }
                    currentAddress={ Utils.tronWeb && Utils.tronWeb.defaultAddress.base58 }
                    tronLinkInstalled={ this.state.tronWeb.installed }
                    onTip={ this.onMessageTip } />
                </div>

                <div id="all-content">
                <div className='header'>
                    <span>点击帖子, 可以打赏</span>
                </div>
                <div className='messages'>
                    { messages }
                </div>
                </div>

            </div>


          <footer className="footer">
      <div className="container">
        <div className="content has-text-centered">
          <p>
            <small>
            All rights reserved. <br/>
            &copy; Copyright 2018
            <strong>&nbsp;&nbsp;tronjoke.me</strong>
            </small>
          </p>
          <p> Powered by ydapp.io </p>
        </div>
      </div>
    </footer>


          </div>

        );
    }
}

export default App;
