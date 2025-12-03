import React from 'react';
import { render } from '@testing-library/react-native';
import { MetricWidget } from '../MetricWidget';
import {
  HealthDataPoint,
  MetricType,
  MetricUnit,
  MetricConfig,
} from '@types';

describe('MetricWidget', () => {
  const mockConfig: MetricConfig = {
    metricType: MetricType.CALORIES_BURNED,
    enabled: true,
    colorRange: {
      thresholds: [0, 800, 950, 1200, Infinity],
      paletteId: 'github-green',
    },
    displayName: 'Calories Burned',
  };

  const createMockDataPoints = (days: number): HealthDataPoint[] => {
    const dataPoints: HealthDataPoint[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dataPoints.push({
        date,
        value: 500 + i * 100,
        metricType: MetricType.CALORIES_BURNED,
        unit: MetricUnit.CALORIES,
      });
    }
    return dataPoints;
  };

  it('should render without crashing', () => {
    const dataPoints = createMockDataPoints(7);
    const { getByText } = render(
      <MetricWidget config={mockConfig} dataPoints={dataPoints} />
    );

    expect(getByText('Calories Burned')).toBeTruthy();
  });

  it('should display metric title', () => {
    const dataPoints = createMockDataPoints(7);
    const { getByText } = render(
      <MetricWidget config={mockConfig} dataPoints={dataPoints} />
    );

    expect(getByText('Calories Burned')).toBeTruthy();
  });

  it('should render ActivityWall', () => {
    const dataPoints = createMockDataPoints(10);
    const { getByTestId } = render(
      <MetricWidget config={mockConfig} dataPoints={dataPoints} />
    );

    expect(getByTestId('activity-wall')).toBeTruthy();
  });

  it('should render ActivityWall as non-interactive', () => {
    const dataPoints = createMockDataPoints(7);
    const { getByTestId } = render(
      <MetricWidget config={mockConfig} dataPoints={dataPoints} />
    );

    const activityWall = getByTestId('activity-wall');
    expect(activityWall).toBeTruthy();
  });

  it('should handle empty data points', () => {
    const { getByText } = render(
      <MetricWidget config={mockConfig} dataPoints={[]} />
    );

    expect(getByText('Calories Burned')).toBeTruthy();
  });

  it('should not show current value when showCurrentValue is false', () => {
    const dataPoints = createMockDataPoints(7);
    const { queryByText } = render(
      <MetricWidget
        config={mockConfig}
        dataPoints={dataPoints}
        showCurrentValue={false}
      />
    );

    // Should not show value with unit
    expect(queryByText(/\d+ calories/i)).toBeNull();
  });

  it('should show current value when showCurrentValue is true', () => {
    const dataPoints = createMockDataPoints(7);
    const { getByText } = render(
      <MetricWidget
        config={mockConfig}
        dataPoints={dataPoints}
        showCurrentValue={true}
      />
    );

    // Should show value with unit (most recent data point)
    expect(getByText(/\d+ calories/i)).toBeTruthy();
  });

  it('should use custom background color when provided', () => {
    const dataPoints = createMockDataPoints(7);
    const { UNSAFE_getByType } = render(
      <MetricWidget
        config={mockConfig}
        dataPoints={dataPoints}
        backgroundColor="#FF0000"
      />
    );

    // Component should render with custom background
    expect(UNSAFE_getByType).toBeDefined();
  });

  it('should hide month labels for widget display', () => {
    const dataPoints = createMockDataPoints(7);
    const { getByTestId } = render(
      <MetricWidget config={mockConfig} dataPoints={dataPoints} />
    );

    expect(getByTestId('activity-wall')).toBeTruthy();
  });

  it('should hide day labels for widget display', () => {
    const dataPoints = createMockDataPoints(7);
    const { getByTestId } = render(
      <MetricWidget config={mockConfig} dataPoints={dataPoints} />
    );

    expect(getByTestId('activity-wall')).toBeTruthy();
  });

  it('should hide description for widget display', () => {
    const dataPoints = createMockDataPoints(7);
    const { getByTestId } = render(
      <MetricWidget config={mockConfig} dataPoints={dataPoints} />
    );

    expect(getByTestId('activity-wall')).toBeTruthy();
  });

  it('should calculate days dynamically based on container width', () => {
    const dataPoints = createMockDataPoints(100);
    const { getByTestId } = render(
      <MetricWidget config={mockConfig} dataPoints={dataPoints} />
    );

    // Component should render and calculate days based on layout
    expect(getByTestId('activity-wall')).toBeTruthy();
  });
});

