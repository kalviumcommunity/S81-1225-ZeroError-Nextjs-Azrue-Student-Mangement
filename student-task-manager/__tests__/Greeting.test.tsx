import { render, screen } from '@testing-library/react';
import Greeting from '../src/components/Greeting';

it('renders greeting message', () => {
  render(<Greeting name="Kalvium" />);
  expect(screen.getByText('Hello, Kalvium!')).toBeInTheDocument();
});
