import React from 'react';

import TronLinkLogo from './TronLinkLogo.png';
import './TronLinkGuide.scss';

const WEBSTORE_URL = 'https://chrome.google.com/webstore/detail/ibnejdfjmmkpcnlpebklmnkoeoihofec/';

const logo = (
    <div className='logo'>
        <img src={ TronLinkLogo } alt='TronLink logo' />
    </div>
);

const openTronLink = () => {
    window.open(WEBSTORE_URL, '_blank');
};

const TronLinkGuide = props => {
    const {
        installed = false
    } = props;

    if(!installed) {
        return (
            <div className='tronLink' onClick={ openTronLink }>
                <div className='info'>
                    <h1>需要安装TronLink</h1>
                    <p>
                        要发帖或者点赞, 你必须安装TronLink. TronLink是一个浏览器波场钱包, 可以从<a href={ WEBSTORE_URL } target='_blank' rel='noopener noreferrer'>Chrome应用商店下载</a>.
                        安装后, 需要刷新此页面.
                    </p>
                </div>
                { logo }
            </div>
        );
    }

    return (
        <div className='tronLink hover' onClick={ openTronLink }>
            <div className='info'>
                <h1>Log in Required</h1>
                <p>
                    需要登录TronLink. 
                </p>
            </div>
            { logo }
        </div>
    );
};

export default TronLinkGuide;
