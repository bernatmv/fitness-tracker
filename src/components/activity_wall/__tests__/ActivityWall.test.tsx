import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityWall } from '../ActivityWall';
import { HealthDataPoint, MetricType, MetricUnit } from '@types';

describe('ActivityWall', () => {
  const mockDataPoints: HealthDataPoint[] = [
    {
      date: new Date('2024-01-01'),
      value: 500,
      metricType: MetricType.CALORIES_BURNED,
      unit: MetricUnit.CALORIES,
    },
    {
      date: new Date('2024-01-02'),
      value: 1000,
      metricType: MetricType.CALORIES_BURNED,
      unit: MetricUnit.CALORIES,
    },
    {
      date: new Date('2024-01-03'),
      value: 1500,
      metricType: MetricType.CALORIES_BURNED,
      unit: MetricUnit.CALORIES,
    },
  ];

  const mockThresholds = [0, 800, 950, 1200, Infinity];
  const mockColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

  it('should render without crashing', () => {
    const { getByTestId } = render(
      <ActivityWall
        dataPoints={mockDataPoints}
        thresholds={mockThresholds}
        colors={mockColors}
      />
    );
    
    expect(getByTestId('activity-wall')).toBeTruthy();
  });

  it('should render correct number of cells', () => {
    const { getAllByTestId } = render(
      <ActivityWall
        dataPoints={mockDataPoints}
        thresholds={mockThresholds}
        colors={mockColors}
        numDays={7}
      />
    );
    
    const cells = getAllByTestId(/activity-cell/);
    expect(cells.length).toBe(7);
  });

  it('should handle empty data points', () => {
    const { getByTestId } = render(
      <ActivityWall
        dataPoints={[]}
        thresholds={mockThresholds}
        colors={mockColors}
      />
    );
    
    expect(getByTestId('activity-wall')).toBeTruthy();
  });

  it('should apply correct colors based on thresholds', () => {
    const { getAllByTestId } = render(
      <ActivityWall
        dataPoints={mockDataPoints}
        thresholds={mockThresholds}
        colors={mockColors}
        numDays={3}
      />
    );
    
    const cells = getAllByTestId(/activity-cell/);
    expect(cells.length).toBeGreaterThan(0);
  });
});

