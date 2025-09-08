import {observable, action} from 'mobx';
import {createFetch} from '../utils/fetch-creator';

class Store {

    // todo
    @observable userInfo = {
        data: {
            userName: 'jeff',
            userId: 98,
            userType: 0,
            userIcon: ''
        }
    };

    @action getUserInfo = () => {
        return createFetch({
            url: 'user'
        }).then(data => {
            this.userInfo = data;
        }).catch(() => {
            window.location = '/login.html';
        });
    }

}

export default new Store()
