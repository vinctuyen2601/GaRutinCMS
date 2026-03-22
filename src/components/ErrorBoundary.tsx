import { Component, ErrorInfo } from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Đã xảy ra lỗi"
          subTitle="Có lỗi không mong muốn xảy ra. Vui lòng thử lại."
          extra={
            <Button type="primary" onClick={() => this.setState({ hasError: false })}>
              Thử lại
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
