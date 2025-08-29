"use client";
import React from 'react';
import RootRouter from '../../src/router';
import { ErrorBoundary } from '../../src/components/error-boundary';

export default function SpaApp() {
  return (
    <ErrorBoundary>
      <RootRouter />
    </ErrorBoundary>
  );
}

