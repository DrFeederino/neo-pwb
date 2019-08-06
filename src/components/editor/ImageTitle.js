import React, { Component } from 'react';
import { FlexBox, FlexItem } from '../flex';
import i18n from 'i18next';
import { Button, Icon } from 'antd';

class ImageTitle extends Component {
  welcomeUser = name => i18n.t('user.welcome') + name + '!';
  render() {
    const { title, isDark, username } = this.props;
    return (
      <FlexBox
        className={'rde-content-layout-title' + (isDark ? ' dark' : '')}
        alignItems="center"
        flexWrap="wrap"
      >
        <FlexItem flex="1 1 auto">
          <FlexBox
            className="rde-content-layout-title-title"
            justifyContent="flex-start"
            alignItems="center"
          >
            {title instanceof String ? <h3>{title}</h3> : title}
          </FlexBox>
        </FlexItem>
        <FlexItem className="rde-content-layout-title-welcome-logout">
          <FlexBox
            className="rde-content-layout-title-welcome"
            justifyContent="flex-end"
            alignItems="center"
          >
            {this.welcomeUser(username)}
            <Icon
              type="user"
              style={{
                backgroundColor: '#000',
                color: '#fff',
                borderRadius: '50%',
                margin: '0 0 0 1em'
              }}
            />
          </FlexBox>
          <Button
            type="primary"
            icon="logout"
            onClick={() => this.props.handleLogout()}
          >
            {i18n.t('user.logout')}
          </Button>
        </FlexItem>
      </FlexBox>
    );
  }
}

export default ImageTitle;
