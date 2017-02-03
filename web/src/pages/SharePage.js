import React, { Component } from 'react';
import Clipboard from 'clipboard';
import styled from 'styled-components';
// import download from 'downloadjs';
import { withRouter } from 'react-router-dom';

import firebase from '../libs/firebase';
import Button from '../components/Button';
import CenterBox from '../components/CenterBox';
import LoadingPage, {
  defaultBackgroundColor as loadingBackgroundColor,
} from '../pages/LoadingPage';
import H1 from '../components/H1';
import Page from '../components/Page';
import SubjectText from '../components/SubjectText';
import { colors, radius } from '../styles/variables';
import { formatSubject } from '../utils/helpers';

const padding = 20;

const GifContainer = styled.div`
  margin: auto;
  padding: ${padding}px;
  max-width: 500px;
  background-color: #fff;
  border-radius: ${radius}px;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.1);
`;

const Gif = styled.img`
  width: 100%;
  min-height: 300px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: ${({ horizontal }) => (horizontal ? 'row' : 'column')};
  align-items: center;
  margin-top: ${padding}px;
  color: ${({ muted }) => (muted ? '#999' : '333')};
  font-size: 15px;
  text-align: left;

  & a {
    color: #000;
  }
`;

const SocialButtons = styled.div`
  flex: 1;
`;

const DownloadButton = styled(Button)`
  margin-left: ${padding / 2}px;
  background-color: #3d3e3d;
  color: #fff;
`;

const Footer = styled.footer`
  display: flex;
  align-items: center;
  margin: -${padding}px;
  margin-top: ${padding}px;
  padding: ${padding}px 0;
  border-bottom-left-radius: ${radius}px;
  border-bottom-right-radius: ${radius}px;
  background-color: ${colors.blue};
`;

const ShareLink = styled.a`
  flex: 1;
  margin-left: ${padding / 2}px;
  color: #fff;
  text-align: right;
  text-decoration: none;
  font-family: 'Alfa Slab One', 'sans-serif', Verdana;
  font-size: 12px;
  font-weight: 300;
  opacity: 0.95;
`;

const CopyButton = styled(Button)`
  margin-left: ${padding / 2}px;
  margin-right: ${padding / 2}px;
  background-color: transparent;
  border-color: #fff;
  font-family: 'Alfa Slab One', 'sans-serif', Verdana;
  font-size: 12px;
  font-weight: 300;
  color: #fff;
  opacity: 0.95;
`;

class SharePage extends Component {
  static defaultProps = {
    action: '',
    backgroundColor: colors.red,
    processing: false,
  };

  static propTypes = {
    action: React.PropTypes.string,
    backgroundColor: React.PropTypes.string,
    changeBackgroundColor: React.PropTypes.func.isRequired,
    processing: React.PropTypes.bool,
    push: React.PropTypes.func.isRequired,
    subject: React.PropTypes.string.isRequired,
  };

  state = {
    copiedURL: '',
    loading: true,
    gifURL: '',
    gifFirebaseRef: null,
    // TODO: Checking action as a workaroung
    // while we dont receive it as prop by doing  push('xx', { processing: true })
    processing: !!this.props.processing || this.props.action === 'PUSH',
    subject: formatSubject(this.props.subject),
  };

  componentDidMount = () => {
    this.loadGif();
    this.updateBackgroundColor();
    this.updateAddThis();
  };

  componentWillReceiveProps = ({ subject }) => {
    const formattedSubject = formatSubject(subject);

    if (formattedSubject && formattedSubject !== this.state.subject) {
      this.setState({ subject: formattedSubject }, () => {
        this.loadGif();
      });
    }
  };

  componentWillUnmount = () => {
    const { gifFirebaseRef } = this.state;

    if (gifFirebaseRef) gifFirebaseRef.off();
  };

  onCopySuccess = ({ text }) => {
    this.setState({ copiedURL: text });
  };

  onCopyError = () => {
    this.setState({ copiedURL: '' });
  };

  getShareURL = () => encodeURI(`http://share.isnowillegal.com/${this.state.subject}`);
  getDownloadURL = () =>
    encodeURI(`http://share.isnowillegal.com/${this.state.subject}.gif`);

  loadGif = () => {
    const {
      gifFirebaseRef: oldGifFirebaseRef,
      processing,
      subject,
    } = this.state;
    const { push } = this.props;

    this.setState({ loading: true });

    // unlisten to previous gif database reference
    if (oldGifFirebaseRef) oldGifFirebaseRef.off();

    const gifFirebaseRef = firebase
      .database()
      .ref(`gifs/${subject.toUpperCase()}/url`);
    gifFirebaseRef.on('value', snapshot => {
      const gifURL = snapshot.val() || '';
      // got the url, stop listening for changes
      if (gifURL) {
        gifFirebaseRef.off();
        this.setState(
          { gifFirebaseRef, gifURL, loading: false, processing: false },
          () => {
            this.updateBackgroundColor();
            this.updateAddThis();
          },
        );
      } else if (!processing) {
        // user opened by url
        // we saw if exists. it didnt. so lets redirect it to the main page
        push(`/#${subject}`);
      }
    });
  };

  download = () => {
    // download(this.getDownloadURL());
    alert('Right click at the Gif > Save image as...', 'How to download');
  };

  updateAddThis = () => {
    setTimeout(
      () => {
        if (
          window.addthis && typeof window.addthis.layers.refresh === 'function'
        ) {
          window.addthis.layers.refresh();
        }
      },
      500,
    );
  };

  updateBackgroundColor = () => {
    const { loading } = this.state;
    const { backgroundColor, changeBackgroundColor } = this.props;

    changeBackgroundColor(loading ? loadingBackgroundColor : backgroundColor);
  };

  registerClipboardListener = htmlElementRef => {
    if (!htmlElementRef) return;

    if (this.clipboardInstance) {
      this.clipboardInstance.destroy();
    }

    this.clipboardInstance = new Clipboard(htmlElementRef);
    this.clipboardInstance.on('success', this.onCopySuccess);
    this.clipboardInstance.on('error', this.onCopyFailed);
  };

  clipboardInstance = null;

  render() {
    const { copiedURL, gifURL, loading, processing, subject } = this.state;
    const { changeBackgroundColor } = this.props;

    if (loading || processing) {
      return (
        <LoadingPage
          changeBackgroundColor={changeBackgroundColor}
          processing={processing}
          subject={subject}
        />
      );
    }

    const shareURL = this.getShareURL();
    const copied = copiedURL === shareURL;

    return (
      <Page background="transparent" title={`${subject} Is Now Illegal!`}>
        <CenterBox>
          <H1><SubjectText>{subject}</SubjectText> is now illegal!</H1>
          <GifContainer>
            <Gif src={gifURL} loading={loading} />
            <Row horizontal>
              <SocialButtons>
                <div
                  className="addthis_inline_share_toolbox"
                  data-title={`${subject} is now illegal! #IsNowIllegal`}
                  data-url={shareURL}
                />
              </SocialButtons>
              <DownloadButton size={14} onClick={this.download}>
                Download
              </DownloadButton>
            </Row>
            <Row muted>
              <p>
                Twitter sharing tip: Download the image, then drag&amp;drop the file to{' '}
                <a href="http://twitter.com" target="_blank">twitter.com</a>. Use the hashtag <a href="https://twitter.com/hashtag/IsNowIllegal?src=hash" target="_blank">#IsNowIllegal</a>.
              </p>
            </Row>
            <Footer>
              <ShareLink href={shareURL}>{shareURL}</ShareLink>
              <CopyButton
                innerRef={this.registerClipboardListener}
                data-clipboard-text={shareURL}
                size={12}
                outline
              >
                {copied ? 'Copied!' : 'Copy'}
              </CopyButton>
            </Footer>
          </GifContainer>
        </CenterBox>
      </Page>
    );
  }
}

export default withRouter(SharePage);
