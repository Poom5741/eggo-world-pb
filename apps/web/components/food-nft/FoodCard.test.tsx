import { test, expect } from 'bun:test';
import { FoodCard } from './FoodCard';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

test('renders FoodCard with grain type', () => {
  const food = {
    food_id: 1,
    token_id: 1,
    food_type: 'grain' as const,
    is_consumed: false,
    minted_at: '2024-01-01T00:00:00Z',
  };

  render(<FoodCard food={food} />);
  
  expect(screen.getByText('Food #1')).toBeInTheDocument();
  expect(screen.getByText('🌾 Grain')).toBeInTheDocument();
});

test('renders FoodCard with fish type', () => {
  const food = {
    food_id: 2,
    token_id: 2,
    food_type: 'fish' as const,
    is_consumed: false,
    minted_at: '2024-01-01T00:00:00Z',
  };

  render(<FoodCard food={food} />);
  
  expect(screen.getByText('🐟 Fish')).toBeInTheDocument();
});

test('renders FoodCard with insects type', () => {
  const food = {
    food_id: 3,
    token_id: 3,
    food_type: 'insects' as const,
    is_consumed: false,
    minted_at: '2024-01-01T00:00:00Z',
  };

  render(<FoodCard food={food} />);
  
  expect(screen.getByText('🦗 Insects')).toBeInTheDocument();
});

test('renders FoodCard with herb type', () => {
  const food = {
    food_id: 4,
    token_id: 4,
    food_type: 'herb' as const,
    is_consumed: false,
    minted_at: '2024-01-01T00:00:00Z',
  };

  render(<FoodCard food={food} />);
  
  expect(screen.getByText('🌿 Herb')).toBeInTheDocument();
});

test('shows consumed badge when food is consumed', () => {
  const food = {
    food_id: 1,
    token_id: 1,
    food_type: 'grain' as const,
    is_consumed: true,
    minted_at: '2024-01-01T00:00:00Z',
  };

  render(<FoodCard food={food} />);
  
  expect(screen.getByText('Consumed')).toBeInTheDocument();
});

test('renders selection checkbox when onSelect is provided', () => {
  const food = {
    food_id: 1,
    token_id: 1,
    food_type: 'grain' as const,
    is_consumed: false,
    minted_at: '2024-01-01T00:00:00Z',
  };

  render(<FoodCard food={food} onSelect={() => {}} />);
  
  const checkbox = screen.getByLabelText(/select to feed/i);
  expect(checkbox).toBeInTheDocument();
});

test('does not render checkbox when disableSelection is true', () => {
  const food = {
    food_id: 1,
    token_id: 1,
    food_type: 'grain' as const,
    is_consumed: false,
    minted_at: '2024-01-01T00:00:00Z',
  };

  render(<FoodCard food={food} onSelect={() => {}} disableSelection />);
  
  expect(screen.queryByLabelText(/select to feed/i)).not.toBeInTheDocument();
});

test('does not render checkbox when food is consumed', () => {
  const food = {
    food_id: 1,
    token_id: 1,
    food_type: 'grain' as const,
    is_consumed: true,
    minted_at: '2024-01-01T00:00:00Z',
  };

  render(<FoodCard food={food} onSelect={() => {}} />);
  
  expect(screen.queryByLabelText(/select to feed/i)).not.toBeInTheDocument();
});
