import Button from "./Button";

export default {
  title: "UI/Button",
  component: Button,
};

export const Primary = {
  render: () => <Button label="Click Me" />,
};

export const Secondary = {
  render: () => <Button label="Cancel" variant="secondary" />,
};
