const config = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "23.4375em", // 375px
        "mantine-breakpoint-sm": "48em", // 768px
        "mantine-breakpoint-md": "60em", // 960px
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
