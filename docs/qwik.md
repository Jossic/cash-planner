========================
CODE SNIPPETS
========================
TITLE: Create and Run Qwik Todo App
DESCRIPTION: Steps to create a new Qwik Todo application using the CLI, install dependencies, and start the development server.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/apps/qwikcity-test/src/routes/docs/getting-started/index.md#_snippet_0

LANGUAGE: shell
CODE:
```
cd qwik-todo
```

LANGUAGE: shell
CODE:
```
npm install
```

LANGUAGE: shell
CODE:
```
npm start
```

----------------------------------------

TITLE: Create Qwik App using CLI
DESCRIPTION: Commands to create a new Qwik application using different package managers (pnpm, npm, yarn, bun). The CLI will guide you through project setup.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
pnpm create qwik@latest
```

LANGUAGE: shell
CODE:
```
npm create qwik@latest
```

LANGUAGE: shell
CODE:
```
yarn create qwik
```

LANGUAGE: shell
CODE:
```
bun create qwik@latest
```

----------------------------------------

TITLE: Getting Started with Qwik
DESCRIPTION: Offers multiple pathways for new users to begin using Qwik, including a getting started guide, a tutorial, and Stackblitz for immediate experimentation.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/(blog)/blog/(articles)/qwik-v1/index.mdx#_snippet_8

LANGUAGE: html
CODE:
```
<ArticleBlock>
  <p>You will find everything you need to get started Qwikly and learn how Qwik provides a new and innovative way to build your web applications whose performance will not deteriorate as the application grows.</p>
</ArticleBlock>
```

----------------------------------------

TITLE: Copy Example Folder
DESCRIPTION: Demonstrates how to copy an existing example folder to create a new one, which is the recommended way to start a new example.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/examples/apps/README.md#_snippet_0

LANGUAGE: shell
CODE:
```
cp -r introduction/hello-world introduction/my-new-example
```

----------------------------------------

TITLE: Start Qwik Development Server
DESCRIPTION: Commands to start the development server for your Qwik application using various package managers.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
pnpm run start
```

LANGUAGE: shell
CODE:
```
npm run start
```

LANGUAGE: shell
CODE:
```
yarn run start
```

LANGUAGE: shell
CODE:
```
bun run start
```

----------------------------------------

TITLE: Run Project Build Commands
DESCRIPTION: Provides the commands to run at the root of the Qwik repository to install dependencies, build the project, and lint the code.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/examples/apps/README.md#_snippet_2

LANGUAGE: shell
CODE:
```
yarn
yarn build
yarn lint
```

----------------------------------------

TITLE: Qwik Introduction - Getting Started Links
DESCRIPTION: This snippet displays a grid of cards linking to key sections of the Qwik documentation and resources. It uses a card-based layout to present options like 'Getting Started', 'Why Qwik?', 'API', 'Courses', 'Community', and 'Qwik City & Routing'.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/index.mdx#_snippet_1

LANGUAGE: html
CODE:
```
<div class="card-grid">
  <a class="card card-center" href="/docs/getting-started/">
    <ImgGettingStartedRocket class="intro-icon" style="margin-bottom:-7px"/>
    <h3>Getting Started</h3>
  </a>
  <a class="card card-center" href="/docs/concepts/think-qwik/">
    <ImgWhyQwikLogo class="intro-icon" />
    <h3>Why Qwik?</h3>
  </a>
  <a class="card card-center" href="/api/">
    <ImgApiServer class="intro-icon" style="margin-bottom:15px"/>
    <h3>API</h3>
  </a>
  <a class="card card-center" href="/ecosystem/#courses">
    <ImgCoursesBook class="intro-icon" style="margin-bottom:15px"/>
    <h3>Courses</h3>
  </a>
  <a class="card card-center" href="https://qwik.dev/chat">
     <ImgCommunityChat class="intro-icon" />
    <h3>Community</h3>
  </a>
  <a class="card card-center" href="/docs/qwikcity/">
    <ImgQwikcityAndRouting class="intro-icon" />
    <h3>Qwik City & Routing</h3>
  </a>
</div>
```

----------------------------------------

TITLE: Complete Component with useTask$ and Server Execution
DESCRIPTION: A full Qwik component example demonstrating the use of `useTask$` to track a favorite state and execute both isomorphic and server-only console logs based on its changes. It also includes route loaders and actions for fetching data and handling form submissions.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_15

LANGUAGE: tsx
CODE:
```
import { component$, useSignal, useTask$ } from '@builder.io/qwik';
import {
  routeLoader$,
  Form,
  routeAction$,
  server$ 
} from '@builder.io/qwik-city';

export const useDadJoke = routeLoader$(async () => {
  const response = await fetch('https://icanhazdadjoke.com/', {
    headers: { Accept: 'application/json' },
  });
  return (await response.json()) as {
    id: string;
    status: number;
    joke: string;
  };
});

export const useJokeVoteAction = routeAction$((props) => {
  console.log('VOTE', props);
});

export default component$(() => {
  const isFavoriteSignal = useSignal(false);
  // Calling our `useDadJoke` hook, will return a reactive signal to the loaded data.
  const dadJokeSignal = useDadJoke();
  const favoriteJokeAction = useJokeVoteAction();
  useTask$(({ track }) => {
    track(() => isFavoriteSignal.value);
    console.log('FAVORITE (isomorphic)', isFavoriteSignal.value);
    server$(() => {
      console.log('FAVORITE (server)', isFavoriteSignal.value);
    })();
  });
  return (
    <section class="section bright">
      <p>{dadJokeSignal.value.joke}</p>
      <Form action={favoriteJokeAction}>
        <input type="hidden" name="jokeID" value={dadJokeSignal.value.id} />
        <button name="vote" value="up">
          👍
        </button>
        <button name="vote" value="down">
          👎
        </button>
      </Form>
      <button
        onClick$={() => (isFavoriteSignal.value = !isFavoriteSignal.value)}
      >
        {isFavoriteSignal.value ? '❤️' : '🤍'}
      </button>
    </section>
  );
});

```

----------------------------------------

TITLE: Serve Build with Deno
DESCRIPTION: Command to start the Deno server for previewing application builds. This command assumes a full build has been completed.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/deno/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run serve
```

----------------------------------------

TITLE: Start Local Netlify Server
DESCRIPTION: Starts a local development server using `netlify dev` to preview the production build and test Netlify Edge Functions locally.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/netlify-edge/README.md#_snippet_2

LANGUAGE: bash
CODE:
```
npm run serve
```

----------------------------------------

TITLE: Update examples-menu.json
DESCRIPTION: Shows how to add a new example entry to the `examples-menu.json` file using a diff format, including its ID, title, description, and icon.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/examples/apps/README.md#_snippet_1

LANGUAGE: diff
CODE:
```
[ 
  {
    "id": "introduction",
    "title": "Introduction",
    "apps": [
      {
        "id": "hello-world",
        "title": "Hello World",
        "description": "The simplest Qwik app.",
        "icon": "🌎"
      },
+      {
+        "id": "my-new-example",
+        "title": "New demo",
+        "description": "Just some text.",
+        "icon": "🙊"
+      }
    ]
  }
]
```

----------------------------------------

TITLE: Package Installation Example
DESCRIPTION: Demonstrates how to install JavaScript packages using npm or yarn, a common practice that contributes to larger bundle sizes.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/(blog)/blog/(articles)/the-qase-for-qwik-love-at-first-tti/index.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
npm install
or
yarn add
```

----------------------------------------

TITLE: Previewing Qwik Production Build
DESCRIPTION: Instructions on how to run a production build of your Qwik application and serve it locally for preview. This helps identify potential issues related to bundling, speculative loading, and overall performance before deploying.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_17

LANGUAGE: shell
CODE:
```
pnpm run preview
```

LANGUAGE: shell
CODE:
```
npm run preview
```

LANGUAGE: shell
CODE:
```
yarn run preview
```

LANGUAGE: shell
CODE:
```
bun run preview
```

----------------------------------------

TITLE: Create a Basic Joke Route
DESCRIPTION: Example of creating a simple route component for a joke application in Qwik. This file defines the content for the '/joke/' route.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_2

LANGUAGE: tsx
CODE:
```
import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return <section class="section bright">A Joke!</section>;
});

```

----------------------------------------

TITLE: Basic Qwik Starter
DESCRIPTION: Demonstrates the creation of a basic 'hello world' Qwik project using `npm init qwik`. It guides through project naming, starter selection, and server choice, providing next steps for installation and running.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/(blog)/blog/(articles)/introducing-qwik-starters/index.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
> npm init qwik
➄❤ Let's create a Qwik project ❤

✔ Project name … qwik-starter
✔ Select a starter › Starter
✔ Select a server › Express

⭐ Success! Project saved in qwik-starter directory

📣 Next steps:
  cd qwik-starter
  npm install
  npm start

> (cd qwik-starter; npm install; npm start)
```

----------------------------------------

TITLE: Install Netlify CLI
DESCRIPTION: Installs the Netlify CLI globally, which is necessary for local development and deployment.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/netlify-edge/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm i -g netlify-cli
```

----------------------------------------

TITLE: Run Capacitor App and Start Qwik Dev Server
DESCRIPTION: This snippet outlines the commands to run the Capacitor application on iOS and Android simulators/emulators, and then start the Qwik development server. This setup facilitates live development by connecting the native app to the running web development server.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwikcity)/guides/capacitor/index.mdx#_snippet_20

LANGUAGE: bash
CODE:
```
npx cap run ios
npx cap run android
```

LANGUAGE: bash
CODE:
```
pnpm run dev
```

----------------------------------------

TITLE: Install Capacitor Dependencies
DESCRIPTION: Commands to install Capacitor core dependencies and initialize Capacitor in a project.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwikcity)/guides/capacitor/index.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
pnpm i @capacitor/cli @capacitor/core
npx cap init
```

----------------------------------------

TITLE: Create Qwik Project (Interactive Mode)
DESCRIPTION: Initiates the Qwik project creation process in interactive mode, guiding the user through setup options.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/create-qwik/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm create qwik@latest
```

----------------------------------------

TITLE: Importing useSignal
DESCRIPTION: Imports the necessary `component$` and `useSignal` functions from the Qwik library to enable component creation and state management.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_6

LANGUAGE: tsx
CODE:
```
import { component$, useSignal } from "@builder.io/qwik";
```

----------------------------------------

TITLE: Create and Run Qwik Project
DESCRIPTION: Commands to create a new Qwik City project using npm, navigate into the project directory, and start the development server. Assumes 'Empty App' starter template.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/(blog)/blog/(articles)/qwik-city-routing/index.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npm create qwik@latest
cd qwik-app
npm start
```

----------------------------------------

TITLE: Executing Isomorphic Code in useTask$
DESCRIPTION: Shows how to include code within `useTask$` that will run on both the server and the client (isomorphically) when the tracked state changes.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_13

LANGUAGE: tsx
CODE:
```
useTask$(({ track }) => {
  track(() => isFavoriteSignal.value);
  console.log('FAVORITE (isomorphic)', isFavoriteSignal.value);
});

```

----------------------------------------

TITLE: Create Qwik App API Example
DESCRIPTION: Demonstrates how to use the `create-qwik` API to programmatically create a new Qwik project with specified options. It requires the `create-qwik` package to be installed.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/create-qwik/README.md#_snippet_2

LANGUAGE: javascript
CODE:
```
const { createApp } = require('create-qwik');

const opts = {
  projectName: 'my-project',
  starterId: 'todo',
  outDir: '/path/to/output/dir',
};

const result = await createApp(opts);
console.log(result);
```

----------------------------------------

TITLE: Local Database Setup
DESCRIPTION: Configuration for connecting to a local LibSQL database and starting the local database server.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/insights/README.md#_snippet_0

LANGUAGE: env
CODE:
```
PRIVATE_LIBSQL_DB_URL=ws://127.0.0.1:8080
PRIVATE_LIBSQL_DB_API_TOKEN=(none)
PRIVATE_AUTH_BASE_API=/api/auth
```

LANGUAGE: sh
CODE:
```
npm run db.local
```

LANGUAGE: sh
CODE:
```
npm run db.migrate
```

----------------------------------------

TITLE: Importing Qwik and Qwik City Hooks
DESCRIPTION: Imports necessary hooks like `useTask$` from Qwik and `server$` from Qwik City for managing tasks and server-side execution.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_11

LANGUAGE: tsx
CODE:
```
import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import {
  routeLoader$,
  Form,
  routeAction$,
  server$ 
} from '@builder.io/qwik-city';

```

----------------------------------------

TITLE: Add Vitest to Qwik Project
DESCRIPTION: Installs Vitest and related testing components into your Qwik project using package manager specific commands. This setup includes a basic example component and its corresponding unit test.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/integrations/vitest/index.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
pnpm run qwik add vitest
```

LANGUAGE: shell
CODE:
```
npm run qwik add vitest
```

LANGUAGE: shell
CODE:
```
yarn run qwik add vitest
```

LANGUAGE: shell
CODE:
```
bun run qwik add vitest
```

----------------------------------------

TITLE: Executing Server-Only Code in useTask$
DESCRIPTION: Illustrates how to wrap code in `server$` within `useTask$` to ensure it only executes on the server when the tracked state changes.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_14

LANGUAGE: tsx
CODE:
```
useTask$(({ track }) => {
  track(() => isFavoriteSignal.value);
  console.log('FAVORITE (isomorphic)', isFavoriteSignal.value);
  server$(() => {
    console.log('FAVORITE (server)', isFavoriteSignal.value);
  })();
});

```

----------------------------------------

TITLE: HTML Entry Point Example
DESCRIPTION: An HTML script tag that initiates the loading of a JavaScript module, starting a potential network waterfall.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwikcity)/advanced/speculative-module-fetching/index.mdx#_snippet_3

LANGUAGE: html
CODE:
```
<script type="module" src="./a.js"></script>
```

----------------------------------------

TITLE: Install Qwik Application Dependencies
DESCRIPTION: Executes the `npm install` command to download and set up all necessary Node.js packages and project dependencies defined in the `package.json` file for the Qwik application.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/apps/qwikcity-test/src/routes/docs/getting-started/index.md#_snippet_1

LANGUAGE: shell
CODE:
```
npm install
```

----------------------------------------

TITLE: Update Base App Dependencies for Publishing
DESCRIPTION: Example JSON snippet showing how the `devDependencies` in the base app's `package.json` are updated when publishing a new version of Qwik. It includes placeholders for the Qwik version and matching TypeScript and Vite versions.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/README.md#_snippet_1

LANGUAGE: json
CODE:
```
{
  "devDependencies": {
    "@builder.io/qwik": "<QWIK_VERSION_BEING_PUBLISHED>",
    "typescript": "<SAME_AS_ROOT_PACKAGE>",
    "vite": "<SAME_AS_ROOT_PACKAGE>"
  }
}
```

----------------------------------------

TITLE: Install Platform-Specific Capacitor Dependencies
DESCRIPTION: Commands to install Capacitor dependencies for iOS and Android platforms.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwikcity)/guides/capacitor/index.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
pnpm i @capacitor/ios @capacitor/android
```

----------------------------------------

TITLE: Install and Configure Capacitor Device Plugin
DESCRIPTION: Steps to install the Capacitor Device plugin and configure it in the `capacitor.config.ts` file for a Qwik project.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwikcity)/guides/capacitor/index.mdx#_snippet_10

LANGUAGE: bash
CODE:
```
pnpm i @capacitor/device
```

LANGUAGE: typescript
CODE:
```
plugins: {
  Device: {
    // No configuration required
  },
}
```

----------------------------------------

TITLE: Run Bun Server
DESCRIPTION: Command to run the Bun server after building the project. This allows previewing the application locally.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/bun/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
bun run serve
```

----------------------------------------

TITLE: Start Qwik Development Server
DESCRIPTION: Command to start the Vite development server for Qwik projects. This command initiates a development environment that includes server-side rendering (SSR) for Qwik applications.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/apps/library/README.md#_snippet_1

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Serve Fastify Application
DESCRIPTION: Command to build and serve the Fastify application locally. After running this, the application can be accessed at http://localhost:3000/.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/fastify/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run serve
```

----------------------------------------

TITLE: Qwik Starter with Builder.io API
DESCRIPTION: Shows how to initialize a Qwik project integrated with the Builder.io Qwik API. This starter is suitable for projects leveraging Builder.io for content management and includes steps for setup and execution.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/(blog)/blog/(articles)/introducing-qwik-starters/index.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
> npm init qwik
➄❤ Let's create a Qwik project ❤

✔ Project name … qwik-builder
✔ Select a starter › Starter Builder
✔ Select a server › Express

⭐ Success! Project saved in qwik-builder directory

📣 Next steps:
  cd qwik-builder
  npm install
  npm start

> (cd qwik-builder; npm install; npm start)
```

----------------------------------------

TITLE: Build Site for Netlify
DESCRIPTION: Builds the Qwik project for deployment, ensuring both SSR and static assets are generated.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/netlify-edge/README.md#_snippet_1

LANGUAGE: bash
CODE:
```
npm run build
```

----------------------------------------

TITLE: Start Development Server
DESCRIPTION: Command to start the Vite development server for Qwik projects. This command also enables server-side rendering (SSR) during development.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/qwik-labs/README.md#_snippet_1

LANGUAGE: bash
CODE:
```
pnpm dev
```

----------------------------------------

TITLE: Build and Run Qwik CLI Locally
DESCRIPTION: Commands to build the Qwik CLI and then run it in a local development environment. This is useful for testing CLI functionality before publishing.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/README.md#_snippet_0

LANGUAGE: zsh
CODE:
```
pnpm build.cli
```

LANGUAGE: zsh
CODE:
```
pnpm cli.qwik
```

----------------------------------------

TITLE: Scaffold Tauri Project
DESCRIPTION: Initializes a new Tauri project with a minimal Rust core, pre-configured for integration with a frontend framework. This command guides the user through essential setup questions.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/integrations/tauri/index.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
pnpm run tauri init
```

LANGUAGE: shell
CODE:
```
npm run tauri init
```

LANGUAGE: shell
CODE:
```
yarn run tauri init
```

LANGUAGE: shell
CODE:
```
bun run tauri init
```

----------------------------------------

TITLE: Tracking State Changes in useTask$
DESCRIPTION: Demonstrates how to use the `track` function within `useTask$` to re-execute the task whenever a specific signal's value changes.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_12

LANGUAGE: tsx
CODE:
```
useTask$(({ track }) => {
  track(() => isFavoriteSignal.value);
});

```

----------------------------------------

TITLE: Install Capawesome Live Update Plugin
DESCRIPTION: Installs the `@capawesome/capacitor-live-update` plugin using pnpm. This is the first step to enable live update functionality in your Capacitor project.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwikcity)/guides/capacitor/index.mdx#_snippet_13

LANGUAGE: bash
CODE:
```
pnpm i @capawesome/capacitor-live-update
```

----------------------------------------

TITLE: Install Rust
DESCRIPTION: Installs Rust using the official rustup script. This is a prerequisite for building the qwik-core library.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/qwik/src/optimizer/core/README.md#_snippet_0

LANGUAGE: shell
CODE:
```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

----------------------------------------

TITLE: Start Qwik Development Server
DESCRIPTION: Launches the local development server for the Qwik application, typically powered by Vite, allowing developers to preview and interact with the application in a web browser.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/apps/qwikcity-test/src/routes/docs/getting-started/index.md#_snippet_2

LANGUAGE: shell
CODE:
```
npm start
```

----------------------------------------

TITLE: Complete Joke Component with State and Actions
DESCRIPTION: A full Qwik component demonstrating state management with `useSignal`, data fetching with `routeLoader$`, and form submission handling with `routeAction$`. It displays a dad joke and allows users to vote, while also featuring a button to toggle a favorite status.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_10

LANGUAGE: tsx
CODE:
```
import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$, Form, routeAction$ } from '@builder.io/qwik-city';

export const useDadJoke = routeLoader$(async () => {
  const response = await fetch('https://icanhazdadjoke.com/', {
    headers: { Accept: 'application/json' },
  });
  return (await response.json()) as {
    id: string;
    status: number;
    joke: string;
  };
});

export const useJokeVoteAction = routeAction$((props) => {
  console.log('VOTE', props);
});

export default component$(() => {
  const isFavoriteSignal = useSignal(false);
  // Calling our `useDadJoke` hook, will return a reactive signal to the loaded data.
  const dadJokeSignal = useDadJoke();
  const favoriteJokeAction = useJokeVoteAction();

  return (
    <section class="section bright">
      <p>{dadJokeSignal.value.joke}</p>
      <Form action={favoriteJokeAction}>
        <input type="hidden" name="jokeID" value={dadJokeSignal.value.id} />
        <button name="vote" value="up">
          👍
        </button>
        <button name="vote" value="down">
          👎
        </button>
      </Form>
      <button
        onClick$={() => (isFavoriteSignal.value = !isFavoriteSignal.value)}
      >
        {isFavoriteSignal.value ? '❤️' : '🤍'}
      </button>
    </section>
  );
});
```

----------------------------------------

TITLE: Start Development Server
DESCRIPTION: Commands to start the Qwik development server using different package managers. This allows you to see the Builder.io integration in action locally.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/integrations/builderio/index.mdx#_snippet_2

LANGUAGE: shell
CODE:
```
pnpm run dev
```

LANGUAGE: shell
CODE:
```
npm run dev
```

LANGUAGE: shell
CODE:
```
yarn run dev
```

LANGUAGE: shell
CODE:
```
bun run dev
```

----------------------------------------

TITLE: Qwik City GET Request Handler
DESCRIPTION: Example of a GET request handler in Qwik City. It accesses URL parameters and returns product data. This handler is defined using `onGet` and is typed with `RequestHandler<ProductData>`.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwikcity)/advanced/request-handling/index.mdx#_snippet_0

LANGUAGE: tsx
CODE:
```
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler<ProductData> = async ({ params }) => {
  // put your DB access here (hard coding data for simplicity)
  return {
    skuId: params.skuId,
    price: 123.45,
    description: `Description for ${params.skuId}`,
  };
};
```

----------------------------------------

TITLE: Capacitor Configuration
DESCRIPTION: Example configuration for the `capacitor.config.ts` file, specifying app ID, name, web directory, and server schemes.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwikcity)/guides/capacitor/index.mdx#_snippet_5

LANGUAGE: typescript
CODE:
```
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'my-qwik-empty-starter',
  webDir: 'dist',
  server: {
    iosScheme: 'capacitor',
    androidScheme: 'https'
  }
};

export default config;
```

----------------------------------------

TITLE: Qwik Optimizer Entry Point Example
DESCRIPTION: Demonstrates how the Qwik Optimizer identifies functions ending with '$' as entry points, leading to lazy-loaded chunks. The example highlights that the `onClick$` entry point does not initially import the `@builder.io/qwik` module.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/tutorial/qrl/optimizer/index.mdx#_snippet_0

LANGUAGE: javascript
CODE:
```
import { component$ } from "@builder.io/qwik";

export const MyComponent = component$(() => {
  const handleClick = (() => {
    console.log("Button clicked!");
  });

  return (
    <button onClick$={handleClick}>
      Click Me
    </button>
  );
});

```

----------------------------------------

TITLE: Enable and Start systemd Service
DESCRIPTION: Commands to enable the Qwik application's systemd service to start on boot and to manually start the service.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/deployments/self-hosting/index.mdx#_snippet_8

LANGUAGE: shell
CODE:
```
sudo systemctl enable qwik-app
sudo systemctl start qwik-app
```

----------------------------------------

TITLE: Bun HTTP Server API
DESCRIPTION: Illustrates the basic structure of a Bun HTTP server, handling requests and responses. This is a foundational example for web applications using Bun.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/bun/README.md#_snippet_1

LANGUAGE: javascript
CODE:
```
import Bun from 'bun';

const server = Bun.serve({
  fetch(req) {
    return new Response("Hello from Bun!");
  },
  port: 3000,
});

console.log(`Listening on http://localhost:${server.port}/`);
```

----------------------------------------

TITLE: Full Component Example
DESCRIPTION: A complete Qwik component example demonstrating the import of an image and its usage within a component's template.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/integrations/image-optimization/index.mdx#_snippet_3

LANGUAGE: tsx
CODE:
```
import { component$ } from '@builder.io/qwik';
import Image from '~/media/your_image.png?jsx';

export default component$(() => {
  return (
    <div>
      <Image />
    </div>
  );
});
```

----------------------------------------

TITLE: CodeSandbox Demo for Modular Forms
DESCRIPTION: Adds a CodeSandbox demo to the Modular Forms guide, offering a practical example for developers to explore.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/(blog)/blog/(articles)/qwik-1-2-performance-autopilot/index.mdx#_snippet_15

LANGUAGE: markdown
CODE:
```
docs: add CodeSandbox demo to Modular Forms guide by @fabian-hiller in https://github.com/QwikDev/qwik/pull/4095
```

----------------------------------------

TITLE: PM2 Process Management
DESCRIPTION: Provides commands for installing, starting, monitoring, and managing Node.js applications using PM2, a popular process manager for Node.js.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/deployments/self-hosting/index.mdx#_snippet_19

LANGUAGE: bash
CODE:
```
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/server/entry.express.js --name qwik-app

# Monitor application
pm2 monit

# View logs
pm2 logs qwik-app

# Set up PM2 to start on system boot
pm2 startup
pm2 save

# Set up PM2 dashboard (optional)
npm install -g pm2-web
pm2-web --config pm2-webrc.json
```

----------------------------------------

TITLE: Docsearch Integration Example
DESCRIPTION: This snippet demonstrates how to import and use the docsearch-react component within a Qwik application. It assumes you have the necessary dependencies installed.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/components/docsearch/README.md#_snippet_0

LANGUAGE: javascript
CODE:
```
import React from "react";
import ReactDOM from "react-dom";
import { DocSearch } from "@docsearch/react";

function App() {
  return (
    <div>
      <DocSearch
        apiKey="YOUR_ALGOLIA_API_KEY"
        indexName="YOUR_ALGOLIA_INDEX_NAME"
        appId="YOUR_ALGOLIA_APP_ID"
        // Other optional props like placeholder, searchParameters, etc.
      />
    </div>
  );
}

// In a Qwik context, you would typically render this within a Qwik component's template.
// For example, if you were using a React adapter for Qwik:
// export const MyDocSearchComponent = component$(() => {
//   return (
//     <Root>
//       <DocSearch ... />
//     </Root>
//   );
// });

```

LANGUAGE: typescript
CODE:
```
import React from "react";
import ReactDOM from "react-dom";
import { DocSearch } from "@docsearch/react";

interface DocSearchProps {
  apiKey: string;
  indexName: string;
  appId: string;
  // Define other props as needed
}

function App(): JSX.Element {
  return (
    <div>
      <DocSearch
        apiKey="YOUR_ALGOLIA_API_KEY"
        indexName="YOUR_ALGOLIA_INDEX_NAME"
        appId="YOUR_ALGOLIA_APP_ID"
        // Other optional props
      />
    </div>
  );
}

// In a Qwik context with TypeScript:
// import { component$ } from "@builder.io/qwik";
// import { Root } from "@docsearch/react"; // Assuming Root is exported or you use a wrapper

// export const MyDocSearchComponent = component$(() => {
//   return (
//     <Root>
//       <DocSearch
//         apiKey="YOUR_ALGOLIA_API_KEY"
//         indexName="YOUR_ALGOLIA_INDEX_NAME"
//         appId="YOUR_ALGOLIA_APP_ID"
//       />
//     </Root>
//   );
// });

```

----------------------------------------

TITLE: Library Entry Point (src/index.ts)
DESCRIPTION: Example `src/index.ts` file that exports components and functions to be exposed by the Qwik library.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/advanced/library/index.mdx#_snippet_3

LANGUAGE: ts
CODE:
```
// As an example, we will export the Logo and Counter components
export { Logo } from './components/logo/logo';
export { Counter } from './components/counter/counter';
```

----------------------------------------

TITLE: Deploy to Production via CLI
DESCRIPTION: Deploys the site manually to production using the Netlify CLI with the `--prod` flag.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/netlify-edge/README.md#_snippet_6

LANGUAGE: bash
CODE:
```
netlify deploy --build --prod
```

----------------------------------------

TITLE: Install qwik-image package
DESCRIPTION: Commands to install the `qwik-image` library using various package managers like pnpm, npm, yarn, and bun.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/integrations/image-optimization/index.mdx#_snippet_11

LANGUAGE: shell
CODE:
```
pnpm install qwik-image
```

LANGUAGE: shell
CODE:
```
npm install qwik-image
```

LANGUAGE: shell
CODE:
```
yarn add qwik-image
```

LANGUAGE: shell
CODE:
```
bun install qwik-image
```

----------------------------------------

TITLE: Qwik Starter with Partytown
DESCRIPTION: Illustrates the setup of a Qwik project utilizing Partytown for running expensive tasks in web workers. This starter helps in understanding how to offload heavy computations to improve main thread performance.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/(blog)/blog/(articles)/introducing-qwik-starters/index.mdx#_snippet_2

LANGUAGE: shell
CODE:
```
> npm init qwik
➄❤ Let's create a Qwik project ❤

✔ Project name … qwik-partytown
✔ Select a starter › Starter Partytown
✔ Select a server › Express

⭐ Success! Project saved in qwik-partytown directory

📣 Next steps:
  cd qwik-partytown
  npm install
  npm start

> (cd qwik-partytown; npm install; npm start)
```

----------------------------------------

TITLE: Install Netlify Edge Adapter
DESCRIPTION: Installs the Netlify Edge adapter for Qwik City using various package managers. This command also automatically installs the Netlify CLI.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/deployments/netlify-edge/index.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
pnpm run qwik add netlify-edge
```

LANGUAGE: shell
CODE:
```
npm run qwik add netlify-edge
```

LANGUAGE: shell
CODE:
```
yarn run qwik add netlify-edge
```

LANGUAGE: shell
CODE:
```
bun run qwik add netlify-edge
```

----------------------------------------

TITLE: Classic TodoMVC Qwik Starter
DESCRIPTION: Provides instructions for creating a classic TodoMVC application using Qwik. This starter is useful for learning Qwik by building a familiar application structure and demonstrates its capabilities in managing state and UI updates.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/(blog)/blog/(articles)/introducing-qwik-starters/index.mdx#_snippet_3

LANGUAGE: shell
CODE:
```
> npm init qwik
➄❤ Let's create a Qwik project ❤

✔ Project name … qwik-todo
✔ Select a starter › Todo
✔ Select a server › Express

⭐ Success! Project saved in qwik-todo directory

📣 Next steps:
  cd qwik-todo
  npm install
  npm start

> (cd qwik-todo; npm install; npm start)
```

----------------------------------------

TITLE: Add Storybook to Qwik Project
DESCRIPTION: Installs Storybook dependencies and adds an example component and stories to your Qwik project using various package managers.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/integrations/storybook/index.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
pnpm run qwik add storybook
```

LANGUAGE: shell
CODE:
```
npm run qwik add storybook
```

LANGUAGE: shell
CODE:
```
yarn run qwik add storybook
```

LANGUAGE: shell
CODE:
```
bun run qwik add storybook
```

----------------------------------------

TITLE: Install eslint-plugin-qwik
DESCRIPTION: Instructions for installing the eslint-plugin-qwik using npm, pnpm, and yarn.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/eslint-plugin-qwik/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm add -D eslint-plugin-qwik
pnpm add -D eslint-plugin-qwik
yarn add -D eslint-plugin-qwik
```

----------------------------------------

TITLE: Qwik Development Builds
DESCRIPTION: Commands to start Qwik development builds. 'pnpm dev' for client-only development and 'pnpm dev.ssr' for server-side rendering (SSR) with client-side modules.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
pnpm dev
```

LANGUAGE: bash
CODE:
```
pnpm dev.ssr
```

----------------------------------------

TITLE: Install Deno Adapter
DESCRIPTION: Installs the Qwik City Deno adapter using various package managers.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/deployments/deno/index.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
pnpm run qwik add deno
```

LANGUAGE: shell
CODE:
```
npm run qwik add deno
```

LANGUAGE: shell
CODE:
```
yarn run qwik add deno
```

LANGUAGE: shell
CODE:
```
bun run qwik add deno
```

----------------------------------------

TITLE: Node.js Server Implementation
DESCRIPTION: Illustrates the core Node.js server setup using the built-in `http.createServer` API. This approach minimizes dependencies and overhead.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/node-server/README.md#_snippet_1

LANGUAGE: javascript
CODE:
```
const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});

const port = 3004;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
```

----------------------------------------

TITLE: Credentials Authentication Setup
DESCRIPTION: Replaces GitHub provider with Credentials for authentication. Includes an example authorize function to validate user credentials. Requires AUTH_SECRET.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/integrations/authjs/index.mdx#_snippet_13

LANGUAGE: ts
CODE:
```
import {
  QwikAuth$,
} from "@auth/qwik";
import Credentials from "@auth/qwik/providers/credentials";

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$(() => ({
  providers: [
    Credentials({
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        const user = {
          id: 1,
          name: "Mike",
          email: "mike@example.com",
        };

        return user;
      },
    }),
  ],
}));
```

----------------------------------------

TITLE: Configure Edge Functions Declaration
DESCRIPTION: Example of how to configure an Edge Function declaration in `netlify.toml` to associate a specific path with a function.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/netlify-edge/README.md#_snippet_3

LANGUAGE: toml
CODE:
```
[[edge_functions]]
  path = "/admin"
  function = "auth"
```

----------------------------------------

TITLE: Run Docs Site Development Server
DESCRIPTION: Starts the development server for the Qwik documentation site.

SOURCE: https://github.com/qwikdev/qwik/blob/main/CONTRIBUTING.md#_snippet_18

LANGUAGE: shell
CODE:
```
pnpm docs.dev
```

----------------------------------------

TITLE: Initialize Native Platforms with Capacitor
DESCRIPTION: Commands to create the native project files for iOS and Android using Capacitor.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwikcity)/guides/capacitor/index.mdx#_snippet_7

LANGUAGE: bash
CODE:
```
npx cap add ios
npx cap add android
```

----------------------------------------

TITLE: Declaring Component State
DESCRIPTION: Initializes a reactive signal named `isFavoriteSignal` with an initial boolean value of `false` to track the favorite status.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_7

LANGUAGE: tsx
CODE:
```
const isFavoriteSignal = useSignal(false);
```

----------------------------------------

TITLE: Scoped CSS Styling in Qwik
DESCRIPTION: Demonstrates how to apply scoped CSS styles to a Qwik component. It involves creating a CSS file, importing it with the `?inline` query parameter, and using the `useStylesScoped$` hook within the component to associate the styles.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_16

LANGUAGE: css
CODE:
```
p {
  font-weight: bold;
}

form {
  float: right;
}
```

LANGUAGE: tsx
CODE:
```
import { component$, useSignal, useStylesScoped$, useTask$ } from "@builder.io/qwik";
import { routeLoader$, Form, routeAction$, server$ } from "@builder.io/qwik-city";
import styles from "./index.css?inline";

export const useDadJoke = routeLoader$(async () => {
  const response = await fetch('https://icanhazdadjoke.com/', {
    headers: { Accept: 'application/json' },
  });
  return (await response.json()) as {
    id: string;
    status: number;
    joke: string;
  };
});

export const useJokeVoteAction = routeAction$((props) => {
  console.log('VOTE', props);
});

export default component$(() => {
  useStylesScoped$(styles);
  const isFavoriteSignal = useSignal(false);
  // Calling our `useDadJoke` hook, will return a reactive signal to the loaded data.
  const dadJokeSignal = useDadJoke();
  const favoriteJokeAction = useJokeVoteAction();
  useTask$(({ track }) => {
    track(() => isFavoriteSignal.value);
    console.log('FAVORITE (isomorphic)', isFavoriteSignal.value);
    server$(() => {
      console.log('FAVORITE (server)', isFavoriteSignal.value);
    })();
  });
  return (
    <section class="section bright">
      <p>{dadJokeSignal.value.joke}</p>
      <Form action={favoriteJokeAction}>
        <input type="hidden" name="jokeID" value={dadJokeSignal.value.id} />
        <button name="vote" value="up">👍</button>
        <button name="vote" value="down">👎</button>
      </Form>
      <button
        onClick$={() => (isFavoriteSignal.value = !isFavoriteSignal.value)}
      >
        {isFavoriteSignal.value ? '❤️' : '🤍'}
      </button>
    </section>
  );
});

```

----------------------------------------

TITLE: Express Server Setup
DESCRIPTION: A minimal Express server implementation for the Qwik project. It allows previewing the built application at a specified local address.

SOURCE: https://github.com/qwikdev/qwik/blob/main/starters/adapters/express/README.md#_snippet_1

LANGUAGE: javascript
CODE:
```
import express from 'express';

const app = express();
const port = 8080;

app.use(express.static('dist')); // Assuming your build output is in 'dist'

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

```

----------------------------------------

TITLE: Install styled-vanilla-extract
DESCRIPTION: Installs the styled-vanilla-extract plugin for using styled-components syntax in Qwik with zero runtime cost.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/components/styles/index.mdx#_snippet_5

LANGUAGE: shell
CODE:
```
pnpm run qwik add styled-vanilla-extract
```

LANGUAGE: shell
CODE:
```
npm run qwik add styled-vanilla-extract
```

LANGUAGE: shell
CODE:
```
yarn run qwik add styled-vanilla-extract
```

LANGUAGE: shell
CODE:
```
bun run qwik add styled-vanilla-extract
```

----------------------------------------

TITLE: Image Example
DESCRIPTION: An example of an image element used within the content, demonstrating how visual aids are incorporated.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/(blog)/blog/(articles)/the-qase-for-qwik-love-at-first-tti/index.mdx#_snippet_12

LANGUAGE: html
CODE:
```
<img class="w-full" src="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F0fc18d23965146978693d6f2033d1f77?width=800" alt='A slide explaining resumability. Leverage what already ran on the server. Server serializes app state then it resumes.' />
```

----------------------------------------

TITLE: Modifying State with onClick$
DESCRIPTION: Attaches an event handler to a button that toggles the boolean value of `isFavoriteSignal` when clicked, updating the UI accordingly.

SOURCE: https://github.com/qwikdev/qwik/blob/main/packages/docs/src/routes/docs/(qwik)/getting-started/index.mdx#_snippet_8

LANGUAGE: tsx
CODE:
```
onClick$={() => {
  isFavoriteSignal.value = !isFavoriteSignal.value;
}}>
```