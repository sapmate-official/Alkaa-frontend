import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
  height: 100%;
`;

const SpinnerContainer = styled.div`
  display: inline-block;
  position: relative;
  width: 64px;
  height: 64px;
`;

const Spinner = styled.div`
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 51px;
  height: 51px;
  margin: 6px;
  border: 6px solid #1976d2;
  border-radius: 50%;
  animation: ${spin} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #1976d2 transparent transparent transparent;
`;

const Loader: React.FC = () => {
  return (
    <LoaderWrapper>
      <SpinnerContainer>
        <Spinner />
      </SpinnerContainer>
    </LoaderWrapper>
  );
};

export default Loader;