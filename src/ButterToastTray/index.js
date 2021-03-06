import React, { Component } from 'react';
import ActionWrapper from '../ActionWrapper';
import { generateToastId, translate } from './helpers';
import linear from 'linear-debounce';
import './style.scss';

class ButterToastTray extends Component {
    constructor(config) {
        super(config);

        this.config = config;

        this.state = { toasts: [] };
        this.toasts = {};

        this.onButterToast = this.onButterToast.bind(this);
        this.setToastHeight = this.setToastHeight.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.triggerDismiss = this.triggerDismiss.bind(this);
        this.isBottom = this.config.trayPosition.indexOf('bottom') > -1;
        this.isRight = this.config.trayPosition.indexOf('-right') > -1;
        this.isCenter = this.config.trayPosition.indexOf('-center') > -1;
        this.debouncer = {};
    }

    componentDidMount() {
        window.addEventListener('ButterToast', this.onButterToast);
    }

    componentWillUnmount() {
        Object.values(this.debouncer).forEach((item) => item.cancel());
        delete this.debouncer;
        window.removeEventListener('ButterToast', this.onButterToast);
    }

    setToastHeight(toastId, height = 0) {
        this.toasts[toastId] = this.toasts[toastId] || {};
        this.toasts[toastId].height = height;
    }

    onMouseEnter(e) {
        const toastId = e.currentTarget.id;
        this.hovering = toastId;
    }

    onMouseLeave(e) {
        const toastId = e.currentTarget.id;
        if (toastId === this.hovering) {
            this.hovering = null;
        }

        if (!this.toasts[toastId].awaitsRemoval) {
            return;
        }

        this.triggerDismiss(toastId);
    }

    triggerDismiss(toastId, force) {
        const key = Date.now(),
            hide = force ? 0 : 300,
            remove = hide + 300;
        this.debouncer[key] = linear({
            [hide.toString()]: () => this.hideToast(toastId, force),
            [remove.toString()]: () => this.removeToast(toastId, force)
        });

        this.debouncer[key]();
    }

    showToast(toastId) {
        this.setState((prevState) => {
            const nextState = Object.assign({}, prevState);
            const index = nextState.toasts.findIndex((toast) => toast.toastId === toastId);

            if (index === -1) {
                return prevState;
            }

            nextState.toasts[index].shown = true;
            nextState.toasts[index].height = this.toasts[toastId].height;
            return nextState;
        });
    }

    hideToast(toastId, force) {
        if (!force && this.hovering === toastId) {
            return this.toasts[toastId].awaitsRemoval = true;
        }
        this.setState((prevState) => {
            const nextState = Object.assign({}, prevState);
            const index = nextState.toasts.findIndex((toast) => toast.toastId === toastId);

            if (index === -1) {
                return prevState;
            }

            nextState.toasts[index].shown = false;
            return nextState;
        });
    }

    removeToast(toastId, force) {
        if (!force && this.hovering === toastId) {
            return this.toasts[toastId].awaitsRemoval = true;
        }
        this.setState((prevState) => ({ toasts: prevState.toasts.filter((toast) => toast.toastId !== toastId)}));
    }

    onButterToast(e) {
        const payload = e.detail;
        if (!payload || (payload.name && payload.name !== this.config.name)) {
            return;
        }

        const timeout = parseInt(payload.toastTimeout, 10) || parseInt(this.config.toastTimeout, 10),
            sticky = payload.sticky,
            hideOn = timeout + 50,
            removeOn = hideOn + 300,
            toastId = generateToastId(),
            height = 0,
            key = Date.now();

        this.setToastHeight(toastId, height);

        this.debouncer[key] = linear({
            '0': () => {
                this.setState((prevState) => ({toasts: [{ toastId, payload, height }].concat(prevState.toasts)}));
            },
            '50': () => this.showToast(toastId),
            [hideOn.toString()]: () => !sticky && this.hideToast(toastId),
            [removeOn.toString()]: () => !sticky && this.removeToast(toastId)
        });
        this.debouncer[key]();
    }

    render() {
        const config = this.config,
            toasts = this.state.toasts,
            isBottom = this.isBottom,
            isRight = this.isRight,
            isCenter = this.isCenter;

        let heights = 0;

        return (
            <div className="wrapper">
                {toasts.map((toast, index) => {
                    const height = parseInt(toasts[index].height, 10);
                    heights += (height + parseInt(config.toastMargin, 10));
                    const style = translate({
                        height: (isBottom ? -heights : heights-height),
                        isRight,
                        isCenter
                    });

                    return (
                        <ActionWrapper key={toast.toastId}
                            setToastHeight={this.setToastHeight}
                            onMouseEnter={this.onMouseEnter}
                            onMouseLeave={this.onMouseLeave}
                            triggerDismiss={this.triggerDismiss}
                            toast={toast}
                            style={style}/>
                    );
                })}
            </div>
        );
    }
}

export default ButterToastTray;