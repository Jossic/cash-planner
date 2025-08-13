========================
CODE SNIPPETS
========================
TITLE: Tauri Application Setup Example
DESCRIPTION: Example of building and running a Tauri application. It demonstrates how to generate the context and handle the `ExitRequested` event to prevent the application from exiting.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
let app = tauri::Builder::default()
  // on an actual app, remove the string argument
  .build(tauri::generate_context!("test/fixture/src-tauri/tauri.conf.json"))
  .expect("error while building tauri application");
app.run(|_app_handle, event| match event {
  tauri::RunEvent::ExitRequested { api, ..} => {
    api.prevent_exit();
  }
  _ => {}
});
```

----------------------------------------

TITLE: Tauri WebviewBuilder Example
DESCRIPTION: A complete Rust example demonstrating how to configure a Tauri window with a webview that includes an initialization script. It shows the setup process, defining the script, and adding the webview to the window.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewBuilder

LANGUAGE: rust
CODE:
```
use tauri::{WindowBuilder, Runtime};

const INIT_SCRIPT: &str = r#"
  if (window.location.origin === 'https://tauri.app') {
    console.log("hello world from js init script");

    window.__MY_CUSTOM_PROPERTY__ = { foo: 'bar' };
  }
"#;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let window = tauri::window::WindowBuilder::new(app, "label").build()?;
      let webview_builder = tauri::webview::WebviewBuilder::new("label", tauri::WebviewUrl::App("index.html".into()))
        .initialization_script(INIT_SCRIPT);
      let webview = window.add_child(webview_builder, tauri::LogicalPosition::new(0, 0), window.inner_size().unwrap())?;
      Ok(())
    });
}
```

----------------------------------------

TITLE: Tauri Setup Hook Example
DESCRIPTION: This Rust code demonstrates how to define the setup hook for a Tauri application. The `setup` function is called once the application is initialized and provides access to the application's manager, allowing you to interact with windows, such as setting their titles.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
  .setup(|app| {
    let main_window = app.get_window("main").unwrap();
    main_window.set_title("Tauri!")?;
    Ok(())
  });
```

----------------------------------------

TITLE: Tauri Plugin Setup Example
DESCRIPTION: Demonstrates how to create and set up a Tauri plugin with a custom state. The `setup` method is called when the plugin is initialized, allowing for managing application state and performing initial configurations.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs

LANGUAGE: rust
CODE:
```
use tauri::{plugin::{Builder, TauriPlugin}, Runtime, Manager};
use std::path::PathBuf;

#[derive(Debug, Default)]
struct PluginState {
   dir: Option<PathBuf>
}

fn init<R: Runtime>() -> TauriPlugin<R> {
Builder::new("example")
  .setup(|app, api| {
    app.manage(PluginState::default());

    Ok(())
  })
  .build()
}
```

----------------------------------------

TITLE: Tauri Plugin Example
DESCRIPTION: An example demonstrating how to create and add a Tauri plugin. The plugin includes a command `do_something` and handles `RunEvent::Ready` and window events. It uses `tauri::plugin::Builder` for setup.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/struct.Builder

LANGUAGE: rust
CODE:
```
mod plugin {
  use tauri::{plugin::{Builder as PluginBuilder, TauriPlugin}, RunEvent, Runtime};

  #[tauri::command]
  async fn do_something<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::Window<R>) -> Result<(), String> {
    println!("command called");
    Ok(())
  }

  pub fn init<R: Runtime>() -> TauriPlugin<R> {
    PluginBuilder::new("window")
      .setup(|app, api| {
        Ok(())
      })
      .on_event(|app, event| {
        match event {
          RunEvent::Ready => {
            println!("app is ready");
          }
          RunEvent::WindowEvent { label, event, .. } => {
            println!("window {} received an event: {:?}", label, event);
          }
          _ => (),
        }
      })
      .invoke_handler(tauri::generate_handler![do_something])
      .build()
  }
}

tauri::Builder::default()
  .plugin(plugin::init());
```

----------------------------------------

TITLE: Tauri Menu Setup Example
DESCRIPTION: Demonstrates how to create a menu with a submenu and a menu item, and attach it to a webview window. It also shows how to handle menu events.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewWindowBuilder

LANGUAGE: rust
CODE:
```
use tauri::menu::{Menu, Submenu, MenuItem};
tauri::Builder::default()
  .setup(|app| {
    let handle = app.handle();
    let save_menu_item = MenuItem::new(handle, "Save", true, None::<&str>)?;
    let menu = Menu::with_items(handle, &[
      &Submenu::with_items(handle, "File", true, &[
        &save_menu_item,
      ])?,
    ])?;
    let webview_window = tauri::WebviewWindowBuilder::new(app, "editor", tauri::WebviewUrl::App("index.html".into()))
      .menu(menu)
      .on_menu_event(move |window, event| {
        if event.id == save_menu_item.id() {
          // save menu item
        }
      })
      .build()
      .unwrap();

    Ok(())
  });
```

----------------------------------------

TITLE: Creating a Webview Window in Setup Hook
DESCRIPTION: Demonstrates how to create a new webview window within the Tauri application's setup hook. This is a common pattern for initializing the main window or additional windows when the application starts.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/webview_window.rs

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
  .setup(|app| {
    let webview_window = tauri::WebviewWindowBuilder::new(app, "label", tauri::WebviewUrl::App("index.html".into()))
      .build()?;
    Ok(())
  });

```

----------------------------------------

TITLE: Tauri Window Event Listener Example
DESCRIPTION: Demonstrates how to listen for a 'component-loaded' event on a Tauri window. This example shows the setup process within the Tauri application builder.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/window/mod.rs

LANGUAGE: rust
CODE:
```
use tauri::{Manager, Listener};

tauri::Builder::default()
  .setup(|app| {
    let window = app.get_window("main").unwrap();
    window.listen("component-loaded", move |event| {
      println!("window just loaded a component");
    });

    Ok(())
  });

```

----------------------------------------

TITLE: Tauri Application Setup
DESCRIPTION: Handles the initial setup of the Tauri application. This includes creating windows based on configuration, setting up assets, and executing any user-defined setup logic. It ensures the application is ready to run.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
#[cfg_attr(feature = "tracing", tracing::instrument(name = "app::setup"))]
fn setup<R: Runtime>(app: &mut App<R>) -> crate::Result<()> {
  app.ran_setup = true;

  for window_config in app.config().app.windows.iter().filter(|w| w.create) {
    WebviewWindowBuilder::from_config(app.handle(), window_config)?.build()?;
  }

  app.manager.assets.setup(app);

  if let Some(setup) = app.setup.take() {
    (setup)(app).map_err(|e| crate::Error::Setup(e.into()))?;
  }

  Ok(())
}
```

----------------------------------------

TITLE: Create Webview in Setup Hook
DESCRIPTION: Demonstrates how to create a webview within the Tauri setup hook. This method is suitable for initializing webviews when the application starts.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/mod.rs

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
  .setup(|app| {
    let window = tauri::window::WindowBuilder::new(app, "label").build()?; 
    let webview_builder = tauri::webview::WebviewBuilder::new("label", tauri::WebviewUrl::App("index.html".into()));
    let webview = window.add_child(webview_builder, tauri::LogicalPosition::new(0, 0), window.inner_size().unwrap());
    Ok(())
  });

```

----------------------------------------

TITLE: Tauri Plugin Setup Method
DESCRIPTION: The `setup` method on the `Builder` allows you to register a closure that will be executed when the plugin is initialized. This closure receives the `AppHandle` and `PluginApi`, enabling state management and other setup tasks.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs

LANGUAGE: rust
CODE:
```
pub fn setup<F>(mut self, setup: F) -> Self
where
  F: FnOnce(&AppHandle<R>, PluginApi<R, C>) -> Result<(), Box<dyn std::error::Error>>
    + Send
    + 'static,
{
  self.setup.replace(Box::new(setup));
  self
}
```

----------------------------------------

TITLE: Tauri Application Setup with Commands and State
DESCRIPTION: Illustrates how to set up a Tauri application, manage custom states (like `MyInt` and `MyString`), and register commands for invocation. This example shows the basic structure for running a Tauri app with managed state.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
use tauri::State;

struct MyInt(isize);
struct MyString(String);

#[tauri::command]
fn int_command(state: State<MyInt>) -> String {
    format!("The stateful int is: {}", state.0)
}

#[tauri::command]
fn string_command<'r>(state: State<'r, MyString>) {
    println!("state: {}", state.inner().0);
}

tauri::Builder::default()
  .manage(MyInt(10))
  .manage(MyString("Hello, managed state!".to_string()))
  .invoke_handler(tauri::generate_handler![int_command, string_command])
  .run(tauri::generate_context!("test/fixture/src-tauri/tauri.conf.json"))
  .expect("error while running tauri application");
```

----------------------------------------

TITLE: Tauri Builder Setup Method
DESCRIPTION: The `setup` method on the Tauri builder allows you to register a closure that will be executed during the application's setup phase. This closure receives a mutable reference to the `App` and can return a `Result` to indicate success or failure. It's commonly used for initial window configuration and other setup tasks.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
pub fn setup<F>(mut self, setup: F) -> Self
  where
    F: FnOnce(&mut App<R>) -> std::result::Result<(), Box<dyn std::error::Error>> + Send + 'static
```

----------------------------------------

TITLE: Example tauri.config.json
DESCRIPTION: An example of a tauri.config.json file, demonstrating how to configure product name, version, build settings (like beforeDevCommand and devUrl), and app-specific properties such as window dimensions and security settings.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/struct.Config

LANGUAGE: json
CODE:
```
{
  "productName": "tauri-app",
  "version": "0.1.0",
  "build": {
    "beforeBuildCommand": "",
    "beforeDevCommand": "",
    "devUrl": "http://localhost:3000",
    "frontendDist": "../dist"
  },
  "app": {
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 600,
        "resizable": true,
        "title": "Tauri App",
        "width": 800
      }
    ]
  },
  "bundle": {},
  "plugins": {}
}
```

----------------------------------------

TITLE: Tauri Application Setup with Webview Command Scope
DESCRIPTION: This snippet demonstrates how to set up a Tauri application, retrieve a webview window, and resolve a command scope for a specific plugin and command. It shows the typical usage pattern within the `setup` closure of `tauri::Builder`.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/mod.rs

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
  .setup(|app| {
    let webview = app.get_webview_window("main").unwrap();
    let scope = webview.resolve_command_scope::<ScopeType>("my-plugin", "read");
    Ok(())
  });
```
```

----------------------------------------

TITLE: Create Webview Window in Setup Hook
DESCRIPTION: Demonstrates creating a new Webview window within the Tauri application's setup hook. This is a common pattern for initializing the main window.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewWindowBuilder

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
.setup(|app| {
let webview_window = tauri::WebviewWindowBuilder::new(app, "label", tauri::WebviewUrl::App("index.html".into()))
.build()?;
Ok(())
});
```

----------------------------------------

TITLE: Tauri Application Setup with State Management
DESCRIPTION: Demonstrates the setup of a Tauri application using `tauri::Builder`. It includes managing custom state types (`MyInt`, `MyString`), asserting the initial state values, and registering commands.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/lib.rs

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
.setup(|app| {
app.manage(MyInt(0));
app.manage(MyString("tauri".into()));
// `MyInt` is already managed, so `manage()` returns false
assert!(!app.manage(MyInt(1)));
// read the `MyInt` managed state with the turbofish syntax
let int = app.state::<MyInt>();
assert_eq!(int.0, 0);
// read the `MyString` managed state with the `State` guard
let val: State<MyString> = app.state();
assert_eq!(val.0, "tauri");
Ok(())
})
.invoke_handler(tauri::generate_handler![int_command, string_command])
// on an actual app, remove the string argument
.run(tauri::generate_context!("test/fixture/src-tauri/tauri.conf.json"))
.expect("error while running tauri application");
```

----------------------------------------

TITLE: Create Tauri Window in Setup Hook
DESCRIPTION: Demonstrates how to create a new Tauri window within the application's setup hook. This is a common pattern for initializing the main window.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/window/struct.WindowBuilder

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
.setup(|app| {
let window = tauri::window::WindowBuilder::new(app, "label")
.build()?;
Ok(())
});
```

----------------------------------------

TITLE: Rust Documentation Links
DESCRIPTION: A collection of useful links to Rust documentation, including the website, book, standard library API reference, Rust by Example, Cargo Guide, and Clippy documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/builders/normal.rs

LANGUAGE: Rust
CODE:
```
https://www.rust-lang.org/
https://doc.rust-lang.org/book/
https://doc.rust-lang.org/std/
https://doc.rust-lang.org/rust-by-example/
https://doc.rust-lang.org/cargo/guide/
https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Create Webview in Setup Hook
DESCRIPTION: Demonstrates creating a webview using WebviewBuilder within the Tauri application's setup hook. This is a common pattern for initializing the main webview.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewBuilder

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
.setup(|app| {
let window = tauri::window::WindowBuilder::new(app, "label").build()?;
let webview_builder = tauri::webview::WebviewBuilder::new("label", tauri::WebviewUrl::App("index.html".into()));
let webview = window.add_child(webview_builder, tauri::LogicalPosition::new(0, 0), window.inner_size().unwrap());
Ok(())
});

```

----------------------------------------

TITLE: Create Window in Setup
DESCRIPTION: Demonstrates how to create a new window when the Tauri application is set up. This is a common pattern for initializing the main application window.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/window/mod.rs

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
.setup(|app| {
let window = tauri::window::WindowBuilder::new(app, "label")
.build()?;
Ok(())
});
```

----------------------------------------

TITLE: Tauri Webview Example: Page Load Handling
DESCRIPTION: An example demonstrating how to use `WebviewBuilder` to set an `on_page_load` handler. This handler logs messages when a page starts or finishes loading, based on the `PageLoadEvent`.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/mod.rs

LANGUAGE: rust
CODE:
```
use tauri::{
utils::config::{Csp, CspDirectiveSources, WebviewUrl},
window::WindowBuilder,
webview::{PageLoadEvent, WebviewBuilder},
};
use http::header::HeaderValue;
use std::collections::HashMap;
tauri::Builder::default()
.setup(|app| {
let window = tauri::window::WindowBuilder::new(app, "label").build()?;
let webview_builder = WebviewBuilder::new("core", WebviewUrl::App("index.html".into()))
.on_page_load(|webview, payload| {
match payload.event() {
PageLoadEvent::Started => {
println!("{} finished loading", payload.url());
}
PageLoadEvent::Finished => {
println!("{} finished loading", payload.url());
}
}
});
let webview = window.add_child(webview_builder, tauri::LogicalPosition::new(0, 0), window.inner_size().unwrap())?;
Ok(())
});
```

----------------------------------------

TITLE: Tauri Webview Page Load Handler Example
DESCRIPTION: Provides an example of setting up a page load event handler for Tauri webviews. This handler is executed when a page starts or finishes loading, allowing custom actions based on the page load status and URL.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewBuilder

LANGUAGE: rust
CODE:
```
use tauri::{
utils::config::{Csp, CspDirectiveSources, WebviewUrl},
window::WindowBuilder,
webview::{PageLoadEvent, WebviewBuilder},
};
use http::header::HeaderValue;
use std::collections::HashMap;
tauri::Builder::default()
.setup(|app| {
let window = tauri::window::WindowBuilder::new(app, "label").build()?;
let webview_builder = WebviewBuilder::new("core", WebviewUrl::App("index.html".into()))
.on_page_load(|webview, payload| {
match payload.event() {
PageLoadEvent::Started => {
println!("{} finished loading", payload.url());
}
PageLoadEvent::Finished => {
println!("{} finished loading", payload.url());
}
}
});
let webview = window.add_child(webview_builder, tauri::LogicalPosition::new(0, 0), window.inner_size().unwrap())?;
Ok(())
});
```

----------------------------------------

TITLE: Rust Documentation Links
DESCRIPTION: A collection of links to essential Rust documentation, including the official website, The Book, Standard Library API Reference, Rust by Example, and the Cargo Guide.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/ipc/format_callback.rs

LANGUAGE: Rust
CODE:
```
https://www.rust-lang.org/
https://doc.rust-lang.org/book/
https://doc.rust-lang.org/std/
https://doc.rust-lang.org/rust-by-example/
https://doc.rust-lang.org/cargo/guide/
https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Rust Resources
DESCRIPTION: A collection of essential links for Rust developers, including the official website, The Book, standard library API reference, Rust by Example, Cargo Guide, and Clippy documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/path/mod.rs

LANGUAGE: APIDOC
CODE:
```
Rust Resources:
- Rust website: https://www.rust-lang.org/
- The Book: https://doc.rust-lang.org/book/
- Standard Library API Reference: https://doc.rust-lang.org/std/
- Rust by Example: https://doc.rust-lang.org/rust-by-example/
- The Cargo Guide: https://doc.rust-lang.org/cargo/guide/
- Clippy Documentation: https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Rust Resources
DESCRIPTION: A collection of essential links for Rust developers, including the official website, The Book, Standard Library API Reference, Rust by Example, Cargo Guide, and Clippy documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/scope/mod.rs

LANGUAGE: Rust
CODE:
```
https://www.rust-lang.org/
https://doc.rust-lang.org/book/
https://doc.rust-lang.org/std/
https://doc.rust-lang.org/rust-by-example/
https://doc.rust-lang.org/cargo/guide/
https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Rust Resources
DESCRIPTION: Links to essential Rust documentation and resources, including the official website, The Book, standard library API reference, Rust by Example, Cargo Guide, and Clippy documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/event/event_name.rs

LANGUAGE: rust
CODE:
```
https://www.rust-lang.org/
https://doc.rust-lang.org/book/
https://doc.rust-lang.org/std/
https://doc.rust-lang.org/rust-by-example/
https://doc.rust-lang.org/cargo/guide/
https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Example JavaScript Initialization Script
DESCRIPTION: An example of a JavaScript initialization script for a Tauri plugin. This script checks the window's origin and sets a custom property if it matches 'https://tauri.app'.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs

LANGUAGE: javascript
CODE:
```
const INIT_SCRIPT: &str = r#"(
if (window.location.origin === 'https://tauri.app') {
console.log("hello world from js init script");

    window.__MY_CUSTOM_PROPERTY__ = { foo: 'bar' };
}
)"#;
```

----------------------------------------

TITLE: Rust Resources
DESCRIPTION: A collection of links to essential Rust documentation and resources, including the official website, The Book, Standard Library API Reference, Rust by Example, The Cargo Guide, and Clippy Documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/mod.rs

LANGUAGE: APIDOC
CODE:
```
Rust Resources:
- Rust website: https://www.rust-lang.org/
- The Book: https://doc.rust-lang.org/book/
- Standard Library API Reference: https://doc.rust-lang.org/std/
- Rust by Example: https://doc.rust-lang.org/rust-by-example/
- The Cargo Guide: https://doc.rust-lang.org/cargo/guide/
- Clippy Documentation: https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Get Current Binary Path
DESCRIPTION: Retrieves the path to the current binary executable. This function is useful for accessing resources relative to the application's executable location. It takes an `Env` object as input, which provides environment information. The example demonstrates how to get the path and use it within the Tauri application setup.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/process/fn.current_binary

LANGUAGE: rust
CODE:
```
use tauri::{process::current_binary, Env, Manager};
let current_binary_path = current_binary(&Env::default()).unwrap();

tauri::Builder::default()
.setup(|app| {
let current_binary_path = current_binary(&app.env())?;
Ok(())
});

```

----------------------------------------

TITLE: Tauri App Initialization
DESCRIPTION: Registers core plugins, sets up the default environment, and manages application scopes. This is a fundamental step in Tauri application setup.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
    app.register_core_plugins()?;

    let env = Env::default();
    app.manage(env);

    app.manage(Scopes {
      #[cfg(feature = "protocol-asset")]
      asset_protocol: crate::scope::fs::Scope::new(
        &app,
        &app.config().app.security.asset_protocol.scope,
      )?,
    });

    app.manage(ChannelDataIpcQueue::default());
    app.handle.plugin(crate::ipc::channel::plugin())?;
```

----------------------------------------

TITLE: Rust Documentation Resources
DESCRIPTION: A collection of links to essential Rust documentation, including the official website, The Book, Standard Library API Reference, Rust by Example, Cargo Guide, and Clippy Documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/test/mod.rs

LANGUAGE: rust
CODE:
```
Rust website: https://www.rust-lang.org/
The Book: https://doc.rust-lang.org/book/
Standard Library API Reference: https://doc.rust-lang.org/std/
Rust by Example: https://doc.rust-lang.org/rust-by-example/
The Cargo Guide: https://doc.rust-lang.org/cargo/guide/
Clippy Documentation: https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Tauri Test Utilities Example
DESCRIPTION: Demonstrates how to use Tauri's test utilities to set up a mock application, define a command, and test its execution via IPC.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/test/mod.rs

LANGUAGE: rust
CODE:
```
use tauri::test::{mock_builder, mock_context, noop_assets};

#[tauri::command]
fn ping() -> &'static str {
"pong"
}

fn create_app<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::App<R> {
builder
.invoke_handler(tauri::generate_handler![ping])
// remove the string argument to use your app's config file
.build(tauri::generate_context!("test/fixture/src-tauri/tauri.conf.json"))
.expect("failed to build app")
}

fn main() {
// Use `tauri::Builder::default()` to use the default runtime rather than the `MockRuntime`;
// let app = create_app(tauri::Builder::default());
let app = create_app(mock_builder());
let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default()).build().unwrap();

    // run the `ping` command and assert it returns `pong`
    let res = tauri::test::get_ipc_response(
        &webview,
        tauri::webview::InvokeRequest {
            cmd: "ping".into(),
            callback: tauri::ipc::CallbackFn(0),
            error: tauri::ipc::CallbackFn(1),
            // alternatively use "tauri://localhost"
            url: "http://tauri.localhost".parse().unwrap(),
            body: tauri::ipc::InvokeBody::default(),
            headers: Default::default(),
            invoke_key: tauri::test::INVOKE_KEY.to_string(),
        },
    ).map(|b| b.deserialize::<String>().unwrap());
}
```

----------------------------------------

TITLE: Tauri Plugin Setup
DESCRIPTION: Defines a closure that runs when the plugin is registered. This is useful for initializing plugin state or performing setup tasks.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/plugin/struct.Builder

LANGUAGE: rust
CODE:
```
use tauri::{plugin::{Builder, TauriPlugin}, Runtime, Manager};
use std::path::PathBuf;

#[derive(Debug, Default)]
struct PluginState {
dir: Option<PathBuf>
}

fn init<R: Runtime>() -> TauriPlugin<R> {
Builder::new("example")
.setup(|app, api| {
app.manage(PluginState::default());

    Ok(())
})
.build()
}
```

----------------------------------------

TITLE: Tauri Assets: Setup
DESCRIPTION: Initializes the asset provider for a Tauri application. This method is crucial for setting up how your application accesses and manages its assets.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/test/struct.NoopAsset

LANGUAGE: rust
CODE:
```
fn setup(&self, app: &[App<R>])
```

----------------------------------------

TITLE: Tauri Command Emitting and Listening for Events
DESCRIPTION: Illustrates how a Tauri command can emit an event ('synchronized') to all windows and how the application can listen for this event during setup. This example shows the interaction between frontend-triggered actions (via commands) and backend event handling, including the use of `emit` and `listen_any`.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/lib.rs

LANGUAGE: rust
CODE:
```
use tauri::{Manager, Emitter, Listener};

#[tauri::command]
fn synchronize(window: tauri::Window) {
// emits the synchronized event to all windows
window.emit("synchronized", ());
}

tauri::Builder::default()
.setup(|app| {
app.listen_any("synchronized", |event| {
println!("app is in sync");
});
Ok(())
})
.invoke_handler(tauri::generate_handler![synchronize]);
```

----------------------------------------

TITLE: Tauri Application Setup with Event Listener
DESCRIPTION: Demonstrates setting up a Tauri application with a listener for the 'ready' event. It shows how to capture the application handle, listen for the event, print a message, and then unlisten from the event using its ID. This pattern is useful for performing actions once the application is fully initialized.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/lib.rs

LANGUAGE: rust
CODE:
```
use tauri::{Manager, Listener};

tauri::Builder::default()
.setup(|app| {
let handle = app.handle().clone();
let handler = app.listen_any("ready", move |event| {
println!("app is ready");

      // we no longer need to listen to the event
      // we also could have used `app.once_global` instead
      handle.unlisten(event.id());
    });

    // stop listening to the event when you do not need it anymore
    app.unlisten(handler);

    Ok(())
});
```

----------------------------------------

TITLE: Tauri Plugin Example
DESCRIPTION: Demonstrates how to create and add a Tauri plugin to an application. This includes defining commands, setting up the plugin, handling application events, and invoking commands from the frontend.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
mod plugin {
use tauri::{plugin::{Builder as PluginBuilder, TauriPlugin}, RunEvent, Runtime};

#[tauri::command]
async fn do_something<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::Window<R>) -> Result<(), String> {
println!("command called");
Ok(())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
PluginBuilder::new("window")
.setup(|app, api| {
Ok(())
})
.on_event(|app, event| {
match event {
RunEvent::Ready => {
println!("app is ready");
}
RunEvent::WindowEvent { label, event, .. } => {
println!("window {} received an event: {:?}", label, event);
}
_ => (),
}
})
.invoke_handler(tauri::generate_handler![do_something])
.build()
}
}
```

----------------------------------------

TITLE: Rust Documentation Links
DESCRIPTION: A collection of essential links to the official Rust documentation, including the website, The Book, Standard Library API Reference, Rust by Example, Cargo Guide, and Clippy documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/predefined.rs

LANGUAGE: APIDOC
CODE:
```
Rust Resources:
- Rust website: https://www.rust-lang.org/
- The Book: https://doc.rust-lang.org/book/
- Standard Library API Reference: https://doc.rust-lang.org/std/
- Rust by Example: https://doc.rust-lang.org/rust-by-example/
- The Cargo Guide: https://doc.rust-lang.org/cargo/guide/
- Clippy Documentation: https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Tauri App Initialization and Event Setup
DESCRIPTION: Initializes the Tauri runtime and sets up event handlers for menu and tray icon interactions. This code configures the application to respond to user actions from the menu bar and system tray, forwarding these events to the main application loop.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
    #[cfg(desktop)]
    {
      // setup menu event handler
      let proxy = runtime.create_proxy();
      muda::MenuEvent::set_event_handler(Some(move |e: muda::MenuEvent| {
        let _ = proxy.send_event(EventLoopMessage::MenuEvent(e.into()));
      }));

      // setup tray event handler
      #[cfg(feature = "tray-icon")]
      {
        let proxy = runtime.create_proxy();
        tray_icon::TrayIconEvent::set_event_handler(Some(move |e: tray_icon::TrayIconEvent| {
          let _ = proxy.send_event(EventLoopMessage::TrayIconEvent(e.into()));
        }));
      }
    }
```

----------------------------------------

TITLE: WebviewWindow Event Handling Example
DESCRIPTION: An example demonstrating how to listen for a 'component-loaded' event on a webview window and then unlisten from it. It also shows the usage of `once` as an alternative.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/webview_window.rs

LANGUAGE: rust
CODE:
```
use tauri::{Manager, Listener};

tauri::Builder::default()
.setup(|app| {
let webview_window = app.get_webview_window("main").unwrap();
let webview_window_ = webview_window.clone();
let handler = webview_window.listen("component-loaded", move |event| {
println!("webview_window just loaded a component");

      // we no longer need to listen to the event
      // we also could have used `webview_window.once` instead
      webview_window_.unlisten(event.id());
    });

    // stop listening to the event when you do not need it anymore
    webview_window.unlisten(handler);

    Ok(())
});
```

----------------------------------------

TITLE: Rust Ecosystem Links
DESCRIPTION: A collection of essential links for Rust developers, including the official website, The Book, standard library API reference, Rust by Example, Cargo Guide, and Clippy documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/menu.rs

LANGUAGE: rust
CODE:
```
https://www.rust-lang.org/
https://doc.rust-lang.org/book/
https://doc.rust-lang.org/std/
https://doc.rust-lang.org/rust-by-example/
https://doc.rust-lang.org/cargo/guide/
https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Rust Documentation Links
DESCRIPTION: A collection of useful links to various Rust documentation resources, including the official website, The Book, Standard Library API Reference, Rust by Example, The Cargo Guide, and Clippy Documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/scope/fs.rs

LANGUAGE: Rust
CODE:
```
https://www.rust-lang.org/
https://doc.rust-lang.org/book/
https://doc.rust-lang.org/std/
https://doc.rust-lang.org/rust-by-example/
https://doc.rust-lang.org/cargo/guide/
https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Building and Running a Tauri Application
DESCRIPTION: This example shows the basic structure for building and running a Tauri application using `tauri::Builder`. It includes generating the application context from a configuration file and handling potential errors during the build process.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
tauri::Builder::default()
// on an actual app, remove the string argument
.run(tauri::generate_context!("test/fixture/src-tauri/tauri.conf.json"))
.expect("error while running tauri application");
```

----------------------------------------

TITLE: JavaScript Initialization Script Example
DESCRIPTION: An example of a JavaScript initialization script that checks the window's origin and logs a message and sets a custom property if the origin matches 'https://tauri.app'. This script is intended to be used with Tauri's webview initialization methods.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/mod.rs

LANGUAGE: javascript
CODE:
```
if (window.location.origin === 'https://tauri.app') {
console.log("hello world from js init script");

window.__MY_CUSTOM_PROPERTY__ = { foo: 'bar' };
}
```

----------------------------------------

TITLE: Initializing Plugins
DESCRIPTION: Initializes all registered plugins for the application, passing the AppHandle for context.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/mod.rs

LANGUAGE: rust
CODE:
```
pub fn initialize_plugins(&self, app: &AppHandle<R>) -> crate::Result<()> {
self
.plugins
.lock()
.expect("poisoned plugin store")
.initialize_all(app, &self.config.plugins)
}
```

----------------------------------------

TITLE: Tauri Application Setup with Custom Menu
DESCRIPTION: Demonstrates how to set up a Tauri application with a custom menu. It includes creating menu items, building a menu, assigning it to a window, and handling menu events.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/window/mod.rs

LANGUAGE: rust
CODE:
```
use tauri::menu::{Menu, Submenu, MenuItem};
tauri::Builder::default()
.setup(|app| {
let handle = app.handle();
let save_menu_item = MenuItem::new(handle, "Save", true, None::<&str>)?;
let menu = Menu::with_items(handle, &[
&Submenu::with_items(handle, "File", true, &[
&save_menu_item,
])?,
])?;
let window = tauri::window::WindowBuilder::new(app, "editor")
.menu(menu)
.build()?;

    window.on_menu_event(move |window, event| {
      if event.id == save_menu_item.id() {
          // save menu item
      }
    });

    Ok(())
});
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/tray.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
- `app.rs`: Core application logic and setup.
- `async_runtime.rs`: Utilities for managing asynchronous operations.
- `error.rs`: Defines error types and handling mechanisms.
- `lib.rs`: The main library entry point and core exports.
- `pattern.rs`: Implements design patterns used within Tauri.
- `plugin.rs`: Core plugin system functionalities.
- `process.rs`: Utilities for managing application processes.
- `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Webview Download Handler Example
DESCRIPTION: Sets up a download handler for a webview window, allowing custom logic for download requests and finished events. It demonstrates how to intercept downloads and specify a destination path.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewWindowBuilder

LANGUAGE: rust
CODE:
```
use tauri::{
utils::config::{Csp, CspDirectiveSources, WebviewUrl},
webview::{DownloadEvent, WebviewWindowBuilder},
};

tauri::Builder::default()
.setup(|app| {
let handle = app.handle();
let webview_window = WebviewWindowBuilder::new(handle, "core", WebviewUrl::App("index.html".into()))
.on_download(|webview, event| {
match event {
DownloadEvent::Requested { url, destination } => {
println!("downloading {}", url);
*destination = "/home/tauri/target/path".into();
}
DownloadEvent::Finished { url, path, success } => {
println!("downloaded {} to {:?}, success: {}", url, path, success);
}
_ => (),
}
// let the download start
true
})
.build()?;

    Ok(())
});

```

----------------------------------------

TITLE: Tauri Url Host Method
DESCRIPTION: Provides examples of using the `host` method to get the parsed host representation of a URL. It illustrates scenarios where a host exists and where it does not.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.Url

LANGUAGE: rust
CODE:
```
use url::Url;

let url = Url::parse("https://127.0.0.1/index.html")?;
assert!(url.host().is_some());

let url = Url::parse("ftp://rms@example.com")?;
assert!(url.host().is_some());

let url = Url::parse("unix:/run/foo.socket")?;
assert!(url.host().is_none());

let url = Url::parse("data:text/plain,Stuff")?;
assert!(url.host().is_none());
```

----------------------------------------

TITLE: Tauri App Run Method
DESCRIPTION: Provides a shorthand for building and running the Tauri application. It takes a `Context` and executes the application, optionally running a closure for initial setup.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
/// Builds the configured application and runs it.
///
/// This is a shorthand for [`Self::build`] followed by [`App::run`].
/// For more flexibility, consider using those functions manually.
pub fn run(self, context: Context<R>) -> crate::Result<()> {
self.build(context)?.run(|_, _| {});
Ok(())
}
```

----------------------------------------

TITLE: Example Usage of SubmenuBuilder
DESCRIPTION: Demonstrates how to use the SubmenuBuilder to create a complex submenu with various item types, including standard menu items, check menu items, icon menu items, and standard actions like cut, copy, and paste. This example is part of a larger Tauri application setup.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/menu/struct.SubmenuBuilder

LANGUAGE: rust
CODE:
```
use tauri::menu::*

tauri::Builder::default()
.setup(move |app| {
let handle = app.handle();
let menu = Menu::new(handle)?;
let submenu = SubmenuBuilder::new(handle, "File")
.item(&MenuItem::new(handle, "MenuItem 1", true, None::<&str>)?)
.items(&[
&CheckMenuItem::new(handle, "CheckMenuItem 1", true, true, None::<&str>)?,
&IconMenuItem::new(handle, "IconMenuItem 1", true, Some(icon1), None::<&str>)?,
])
.separator()
.cut()
.copy()
.paste()
.separator()
.text("item2", "MenuItem 2")
.check("checkitem2", "CheckMenuItem 2")
.icon("iconitem2", "IconMenuItem 2", app.default_window_icon().cloned().unwrap())
.build()?;
menu.append(&submenu)?;
app.set_menu(menu);
Ok(())
});

```

----------------------------------------

TITLE: Rust Ecosystem Links
DESCRIPTION: A collection of essential links for Rust developers, including the official website, The Book, standard library API reference, Rust by Example, Cargo Guide, and Clippy documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/window/mod.rs

LANGUAGE: Rust
CODE:
```
* [Rust website](https://www.rust-lang.org/)
* [The Book](https://doc.rust-lang.org/book/)
* [Standard Library API Reference](https://doc.rust-lang.org/std/)
* [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
* [The Cargo Guide](https://doc.rust-lang.org/cargo/guide/)
* [Clippy Documentation](https://doc.rust-lang.org/nightly/clippy)
```

----------------------------------------

TITLE: Tauri MenuBuilder Example
DESCRIPTION: Demonstrates how to create a custom application menu using the MenuBuilder in Tauri. It shows adding various menu items like text, checkable items, and icon items, as well as standard edit actions (cut, copy, paste) and separators. This example is intended for use within the Tauri application setup.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/builders/menu.rs

LANGUAGE: rust
CODE:
```
use tauri::menu::*;
tauri::Builder::default()
.setup(move |app| {
let handle = app.handle();
let icon1 = tauri::image::Image::new(&[], 0, 0);
let menu = MenuBuilder::new(handle)
.item(&MenuItem::new(handle, "MenuItem 1", true, None::<&str>)?)
.items(&[
&CheckMenuItem::new(handle, "CheckMenuItem 1", true, true, None::<&str>)?,
&IconMenuItem::new(handle, "IconMenuItem 1", true, Some(icon1), None::<&str>)?,
])
.separator()
.cut()
.copy()
.paste()
.separator()
.text("item2", "MenuItem 2")
.check("checkitem2", "CheckMenuItem 2")
.icon("iconitem2", "IconMenuItem 2", app.default_window_icon().cloned().unwrap())
.build()?;
app.set_menu(menu);
Ok(())
});

```

----------------------------------------

TITLE: Creating a Webview Window in a Command
DESCRIPTION: Provides an example of how to create a webview window in response to a Tauri command. This allows for dynamic window creation based on user interaction or application logic.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/webview_window.rs

LANGUAGE: rust
CODE:
```
#[tauri::command]

```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/tray/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
- `app.rs`: Core application logic and setup.
- `async_runtime.rs`: Utilities for managing asynchronous operations.
- `error.rs`: Defines error types and handling mechanisms.
- `lib.rs`: The main library entry point and core exports.
- `pattern.rs`: Implements design patterns used within Tauri.
- `plugin.rs`: Core plugin system functionalities.
- `process.rs`: Utilities for managing application processes.
- `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Rust Result as_ref Example
DESCRIPTION: Demonstrates how to use the `as_ref` method on a Rust Result to get an immutable reference to the contained value without consuming the Result.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/type.Result

LANGUAGE: rust
CODE:
```
let x: Result<u32, &str> = Ok(2);
assert_eq!(x.as_ref(), Ok(&2));

let x: Result<u32, &str> = Err("Error");
assert_eq!(x.as_ref(), Err(&"Error"));
```

----------------------------------------

TITLE: Related Rust Resources
DESCRIPTION: A collection of essential links for Rust developers, including the official Rust website, The Book, Standard Library API Reference, Rust by Example, The Cargo Guide, and Clippy Documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/mod.rs

LANGUAGE: Rust
CODE:
```
https://www.rust-lang.org/
https://doc.rust-lang.org/book/
https://doc.rust-lang.org/std/
https://doc.rust-lang.org/rust-by-example/
https://doc.rust-lang.org/cargo/guide/
https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Tauri Webview Window Examples
DESCRIPTION: Demonstrates how to access and interact with the webview window within a Tauri application, specifically showing how to open developer tools in debug mode.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewWindow

LANGUAGE: rust
CODE:
```
use tauri::Manager;
tauri::Builder::default()
.setup(|app| {
#[cfg(debug_assertions)]
{
let webview = app.get_webview_window("main").unwrap();
if !webview.is_devtools_open() {
webview.open_devtools();
}
}
Ok(())
});

```

----------------------------------------

TITLE: Rust Ecosystem Resources
DESCRIPTION: A collection of essential links for Rust developers, including the official website, The Book, Standard Library API Reference, Rust by Example, Cargo Guide, and Clippy documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/ipc/mod.rs

LANGUAGE: Rust
CODE:
```
Rust website: https://www.rust-lang.org/
The Book: https://doc.rust-lang.org/book/
Standard Library API Reference: https://doc.rust-lang.org/std/
Rust by Example: https://doc.rust-lang.org/rust-by-example/
The Cargo Guide: https://doc.rust-lang.org/cargo/guide/
Clippy Documentation: https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Run Tauri Application
DESCRIPTION: This function runs the Tauri application with a provided callback for event handling. It panics if the setup function fails. The callback receives an `AppHandle` and a `RunEvent`.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
pub fn run<F: FnMut(&AppHandle<R>, RunEvent) + 'static>(mut self, callback: F) {
self.handle.event_loop.lock().unwrap().main_thread_id = std::thread::current().id();

self
.runtime
.take()
.unwrap()
.run(self.make_run_event_loop_callback(callback));
}
```

----------------------------------------

TITLE: Get URL Authority String
DESCRIPTION: Provides an example of retrieving the authority part of a URL as a string. This includes details on how non-ASCII domains, IPv6 addresses, and ports are represented.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.Url

LANGUAGE: rust
CODE:
```
use url::Url;

let url = Url::parse("ftp://rms@example.com")?;
// The authority method would return "rms@example.com" here.
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/test/mock_runtime.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
- `app.rs`: Core application logic and setup.
- `async_runtime.rs`: Utilities for managing asynchronous operations.
- `error.rs`: Defines error types and handling mechanisms.
- `lib.rs`: The main library entry point and core exports.
- `pattern.rs`: Implements design patterns used within Tauri.
- `plugin.rs`: Core plugin system functionalities.
- `process.rs`: Utilities for managing application processes.
- `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Sending a message using an OwnedPermit
DESCRIPTION: Example demonstrating how to use `reserve_owned` to get an `OwnedPermit` and send a message. It shows reserving capacity, sending the message, and then reusing the sender.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/async_runtime/struct.Sender

LANGUAGE: rust
CODE:
```
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
let (tx, mut rx) = mpsc::channel(1);

    // Reserve capacity, moving the sender.
    let permit = tx.reserve_owned().await.unwrap();

    // Send a message, consuming the permit and returning
    // the moved sender.
    let tx = permit.send(123);

    // The value sent on the permit is received.
    assert_eq!(rx.recv().await.unwrap(), 123);

    // The sender can now be used again.
    tx.send(456).await.unwrap();
}
```

----------------------------------------

TITLE: Capability File Structure Example
DESCRIPTION: Illustrates a typical directory layout for capability JSON files within a Tauri project, showing how capabilities can be organized by app flavor (e.g., beta, stable).

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/lib.rs

LANGUAGE: markdown
CODE:
```
```md
/// ├── capabilities
/// │   ├── app (default capabilities used by any app flavor)
/// |   |   |-- cap.json
/// │   ├── beta (capabilities only added to a `beta` flavor)
/// │   |   |-- cap.json
/// │   ├── stable (capabilities only added to a `stable` flavor)
/// |       |-- cap.json
/// ```
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/tray/mod.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Event Synchronization Example
DESCRIPTION: Demonstrates how to emit a 'synchronized' event from a Tauri command and listen for it in the application setup. This is useful for coordinating actions across different parts of the application.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/trait.Listener

LANGUAGE: rust
CODE:
```
use tauri::{Manager, Listener, Emitter};

#[tauri::command]
fn synchronize(window: tauri::Window) {
  // emits the synchronized event to all windows
  window.emit("synchronized", ());
}

tauri::Builder::default()
  .setup(|app| {
    app.listen("synchronized", |event| {
      println!("app is in sync");
    });
    Ok(())
  })
  .invoke_handler(tauri::generate_handler![synchronize]);
```

----------------------------------------

TITLE: Rust Ecosystem Resources
DESCRIPTION: Links to essential resources within the Rust programming language ecosystem, including the official website, The Book, standard library API reference, Rust by Example, Cargo Guide, and Clippy documentation.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app/plugin.rs

LANGUAGE: Rust
CODE:
```
Rust website: https://www.rust-lang.org/
The Book: https://doc.rust-lang.org/book/
Standard Library API Reference: https://doc.rust-lang.org/std/
Rust by Example: https://doc.rust-lang.org/rust-by-example/
The Cargo Guide: https://doc.rust-lang.org/cargo/guide/
Clippy Documentation: https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/builders/menu.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Receiver: len()
DESCRIPTION: Shows how to get the current number of messages waiting in a Tokio MPSC channel using the `len` method. The example verifies the count before and after sending a message.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/async_runtime/struct.Receiver

LANGUAGE: rust
CODE:
```
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, rx) = mpsc::channel(10);
    assert_eq!(0, rx.len());

    tx.send(0).await.unwrap();
    assert_eq!(1, rx.len());
}
```

----------------------------------------

TITLE: Example: Download Progress Event
DESCRIPTION: Demonstrates how to use the `emit_filter` method to send download progress updates to a specific webview window labeled 'main'. This example simulates a download process and emits progress events periodically.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/trait.Emitter

LANGUAGE: rust
CODE:
```
use tauri::{Emitter, EventTarget};

#[tauri::command]
fn download(app: tauri::AppHandle) {
  for i in 1..100 {
    std::thread::sleep(std::time::Duration::from_millis(150));
    // emit a download progress event to the updater window
    app.emit_filter("download-progress", i, |t| match t {
      EventTarget::WebviewWindow { label } => label == "main",
      _ => false,
    });
  }
}
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/menu.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Get URL Path
DESCRIPTION: Returns the path for a given URL as a percent-encoded ASCII string. For non-base URLs, it's an arbitrary string; for others, it starts with '/' and includes slash-separated segments.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/struct.Url

LANGUAGE: rust
CODE:
```
pub fn path(&self) -> &[str]
```

LANGUAGE: rust
CODE:
```
use url::{Url, ParseError};

let url = Url::parse("https://example.com/api/versions?page=2")?;
assert_eq!(url.path(), "/api/versions");

let url = Url::parse("https://example.com")?;
assert_eq!(url.path(), "/");

let url = Url::parse("https://example.com/countries/việt nam")?;
assert_eq!(url.path(), "/countries/vi%E1%BB%87t%20nam");
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/predefined.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Setup Hook
DESCRIPTION: Defines a closure that is executed once when the Tauri application is setting up. This hook allows for initialization logic and returns a Result, indicating success or failure during setup.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
pub type SetupHook<R> = Box<dyn FnOnce(&mut App<R>) -> std::result::Result<(), Box<dyn std::error::Error>> + Send>;

```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/process.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/window.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/webview_window.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Command Execution Example
DESCRIPTION: Demonstrates how to execute a Tauri command within a test environment. It shows setting up a mock application with a specific command handler and then executing that command.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/test/mod.rs

LANGUAGE: rust
CODE:
```
/// Executes the given IPC message and assert the response matches the expected value.
///
/// # Examples
///
/// ```rust
/// use tauri::test::{mock_builder, mock_context, noop_assets};
///
/// #[tauri::command]
/// fn ping() -> &'static str {
///     "pong"
/// }
///
/// fn create_app<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::App<R> {
///     builder
///         .invoke_handler(tauri::generate_handler![ping])
///         // remove the string argument to use your app's config file
///         .build(tauri::generate_context!("test/fixture/src-tauri/tauri.conf.json"))
///         .expect("failed to build app")
/// }
///
/// fn main() {
///     let app = create_app(mock_builder());
/// }
```

----------------------------------------

TITLE: Example: Handling Menu Events
DESCRIPTION: Provides an example of how to register an event handler for menu events. This example shows how to detect a 'quit' event and exit the application gracefully.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
use tauri::menu::*;

tauri::Builder::default()
  .on_menu_event(|app, event| {
     if event.id() == "quit" {
       app.exit(0);
     }
  });
```

----------------------------------------

TITLE: Tauri Plugin Builder Example
DESCRIPTION: Demonstrates the usage of the Tauri Plugin Builder to configure and build a plugin. This includes defining plugin options, setting them via builder methods, and constructing the final TauriPlugin.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs

LANGUAGE: rust
CODE:
```
use tauri::{plugin::{Builder as PluginBuilder, TauriPlugin}, Runtime};
use serde::de::DeserializeOwned;

pub struct Builder<R: Runtime, C: DeserializeOwned = ()> {
  name: &'static str,
  option_a: String,
  option_b: String,
  option_c: bool
}

impl<R: Runtime> Default for Builder<R> {
  fn default() -> Self {
    Self {
      name: "example",
      option_a: "foo".to_string(),
      option_b: "bar".to_string(),
      option_c: false
    }
  }
}

impl<R: Runtime> Builder<R> {
  pub fn new() -> Self {
    Default::default()
  }

  pub fn option_a(mut self, option_a: String) -> Self {
    self.option_a = option_a;
    self
  }

  pub fn option_b(mut self, option_b: String) -> Self {
    self.option_b = option_b;
    self
  }

  pub fn option_c(mut self, option_c: bool) -> Self {
    self.option_c = option_c;
    self
  }

  pub fn build(self) -> TauriPlugin<R> {
    tauri::plugin::PluginBuilder::new(self.name)
      .setup(move |app_handle, api| {
        println!("a: {}, b: {}, c: {}", self.option_a, self.option_b, self.option_c);
        Ok(())
      })
      .build()
  }
}
```

----------------------------------------

TITLE: Webview Window Configuration and Creation
DESCRIPTION: This section covers the configuration and building of a Webview Window. It includes methods for setting up event listeners like page load events and for finalizing the window creation process.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/webview_window.rs

LANGUAGE: rust
CODE:
```
pub fn on_page_load<F: Fn(WebviewWindow<R>, PageLoadPayload<'_>) + Send + Sync + 'static>(
    mut self,
    f: F,
) -> Self {
    self.webview_builder = self.webview_builder.on_page_load(move |webview, payload| {
      f(
        WebviewWindow {
          window: webview.window(),
          webview,
        },
        payload,
      )
    });
    self
}

/// Creates a new window.
pub fn build(self) -> crate::Result<WebviewWindow<R>> {
    let (window, webview) = self.window_builder.with_webview(self.webview_builder)?;
    Ok(WebviewWindow { window, webview })
}
```

----------------------------------------

TITLE: Create Webview Window
DESCRIPTION: Demonstrates how to create a new webview window using the WebviewWindowBuilder. This example shows the basic steps of initializing the builder with an application handle, a label, and a URL, then building and unwrapping the window.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/webview_window.rs

LANGUAGE: rust
CODE:
```
async fn create_window(app: tauri::AppHandle) {
  let webview_window = tauri::WebviewWindowBuilder::new(&app, "label", tauri::WebviewUrl::App("index.html".into()))
    .build()
    .unwrap();
}
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/menu.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Modules Overview
DESCRIPTION: Lists the available modules within the Tauri framework version 2.7.0, providing links to their respective documentation pages. This includes modules for asynchronous runtime, image handling, inter-process communication, menus, paths, plugins, processes, scopes, testing, tray icons, and webviews.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/path/index

LANGUAGE: APIDOC
CODE:
```
Tauri Modules (v2.7.0):
  - async_runtime: https://docs.rs/tauri/2.7.0/tauri/async_runtime/index.html
  - image: https://docs.rs/tauri/2.7.0/tauri/image/index.html
  - ipc: https://docs.rs/tauri/2.7.0/tauri/ipc/index.html
  - menu: https://docs.rs/tauri/2.7.0/tauri/menu/index.html
  - path: https://docs.rs/tauri/2.7.0/tauri/path/index.html
  - plugin: https://docs.rs/tauri/2.7.0/tauri/plugin/index.html
  - process: https://docs.rs/tauri/2.7.0/tauri/process/index.html
  - scope: https://docs.rs/tauri/2.7.0/tauri/scope/index.html
  - test: https://docs.rs/tauri/2.7.0/tauri/test/index.html
  - tray: https://docs.rs/tauri/2.7.0/tauri/tray/index.html
  - webview: https://docs.rs/tauri/2.7.0/tauri/webview/index.html
  - window: https://docs.rs/tauri/2.7.0/tauri/window/index.html
```

----------------------------------------

TITLE: Initialize and Add Tauri Plugin
DESCRIPTION: Demonstrates how to initialize a Tauri plugin and add it to the application during the setup phase. This involves creating a plugin using `PluginBuilder` and registering it with the application handle.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
use tauri::{plugin::{Builder as PluginBuilder, TauriPlugin}, Runtime};

fn init_plugin<R: Runtime>() -> TauriPlugin<R> {
  PluginBuilder::new("dummy").build()
}

tauri::Builder::default()
  .setup(move |app| {
    let handle = app.handle().clone();
    std::thread::spawn(move || {
      handle.plugin(init_plugin());
    });

    Ok(())
  });
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/path/desktop.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/builders/normal.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Create and Prepare Webview
DESCRIPTION: Handles the preparation and creation of a new webview. It checks for existing webviews with the same label to prevent duplicates and determines the correct URL, including handling proxy development server configurations and local network URLs. It also manages the injection of initialization scripts.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/webview.rs

LANGUAGE: rust
CODE:
```
pub fn prepare_webview<M: Manager<R>>(
  &self,
  manager: &M,
  mut pending: PendingWebview<EventLoopMessage, R>,
  window_label: &str,
) -> crate::Result<PendingWebview<EventLoopMessage, R>> {
  if self.webviews_lock().contains_key(&pending.label) {
    return Err(crate::Error::WebviewLabelAlreadyExists(pending.label));
  }

  let app_manager = manager.manager();

  let mut url = match &pending.webview_attributes.url {
    WebviewUrl::App(path) => {
      let app_url = app_manager.get_url(pending.webview_attributes.use_https_scheme);
      let url = if PROXY_DEV_SERVER && is_local_network_url(&app_url) {
        Cow::Owned(Url::parse("tauri://localhost").unwrap())
      } else {
        app_url
      };
      if path.to_str() != Some("index.html") {
        url.join(&path.to_string_lossy()).map_err(crate::Error::InvalidUrl)?
      } else {
        url
      }
    }
    // ... other URL variants
  };

  // ... further processing and script injection
  Ok(pending)
}
```

----------------------------------------

TITLE: WebviewWindow Monitor Information
DESCRIPTION: Provides methods to retrieve information about the system's monitors. This includes getting the primary monitor, finding a monitor by coordinates, and listing all available monitors. These functions are crucial for multi-monitor setups and positioning windows.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewWindow

LANGUAGE: APIDOC
CODE:
```
pub fn primary_monitor(&self) -> Result<Option<Monitor>>
  Returns the primary monitor of the system.
  Returns None if it can’t identify any monitor as a primary one.

pub fn monitor_from_point(&self, x: f64, y: f64) -> Result<Option<Monitor>>
  Returns the monitor that contains the given point.

pub fn available_monitors(&self) -> Result<Vec<Monitor>>
  Returns the list of all the monitors available on the system.
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/normal.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Unlisten to Window Event
DESCRIPTION: Removes an event listener from the window using its `EventId`. This is crucial for preventing memory leaks and ensuring that handlers are not called after they are no longer needed. The example demonstrates unlistening within a setup closure.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/window/mod.rs

LANGUAGE: rust
CODE:
```
/// Unlisten to an event on this window.
///
/// # Examples
///
/// ```
/// use tauri::{Manager, Listener};
///
/// tauri::Builder::default()
///   .setup(|app| {
///     let window = app.get_window("main").unwrap();
///     let window_ = window.clone();
///     let handler = window.listen("component-loaded", move |event| {
///       println!("window just loaded a component");
///
///       // we no longer need to listen to the event
///       // we also could have used `window.once` instead
///       window_.unlisten(event.id());
///     });
///
///     // stop listening to the event when you do not need it anymore
///     window.unlisten(handler);
///
///     Ok(())
///   });
/// ```
fn unlisten(&self, id: EventId) {
  self.manager.unlisten(id)
}
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/window/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Url as_str Example
DESCRIPTION: Demonstrates the usage of the `as_str` method, which returns the URL as a string slice. This is an efficient way to get the string representation of a URL, as the serialization is already stored within the `Url` struct.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.Url

LANGUAGE: rust
CODE:
```
use url::Url;

let url_str = "https://example.net/";
let url = Url::parse(url_str)?;
assert_eq!(url.as_str(), url_str);
```

----------------------------------------

TITLE: Tauri Event Listening Example
DESCRIPTION: Demonstrates how to listen for a specific event ('component-loaded') in a Tauri application. It shows how to get a window, clone it for use in a closure, and set up a listener that prints a message and then unlistens from the event. It also shows how to manually unlisten from an event using its ID.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/window/struct.Window

LANGUAGE: rust
CODE:
```
use tauri::{Manager, Listener};

tauri::Builder::default()
  .setup(|app| {
    let window = app.get_window("main").unwrap();
    let window_ = window.clone();
    let handler = window.listen("component-loaded", move |event| {
      println!("window just loaded a component");

      // we no longer need to listen to the event
      // we also could have used `window.once` instead
      window_.unlisten(event.id());
    });

    // stop listening to the event when you do not need it anymore
    window.unlisten(handler);

    Ok(())
  });

```

----------------------------------------

TITLE: Rust Webview Emit Example
DESCRIPTION: Example of emitting a JSON serializable event from a Tauri webview using Rust.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.Webview

LANGUAGE: rust
CODE:
```
use tauri::Manager;

// Assuming 'app_handle' is a handle to your Tauri application
let app_handle = /* get your app handle */;

// Emit a simple string event
app_handle.emit_all("my-event", "Hello from Rust!").unwrap();

// Emit a JSON serializable payload
#[derive(serde::Serialize)]
struct MyPayload {
    message: String,
    value: i32,
}

let payload = MyPayload { message: "Data payload".to_string(), value: 42 };
app_handle.emit_all("data-event", payload).unwrap();

// Emit to a specific window (assuming you have a window label)
let window_label = "main"; // Replace with your actual window label
if let Some(window) = app_handle.get_window(window_label) {
    window.emit("specific-event", "Message for specific window").unwrap();
}
```

----------------------------------------

TITLE: Tauri Event Plugin Setup
DESCRIPTION: This snippet shows the basic setup for the Tauri event plugin in Rust, including necessary imports and plugin builder usage. It demonstrates how to register the event plugin with the Tauri application.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/event/plugin.rs

LANGUAGE: rust
CODE:
```
use crate::plugin::{Builder, TauriPlugin};
use crate::{command, ipc::CallbackFn, EventId, Result, Runtime};
use crate::{AppHandle, Emitter, Manager, Webview};
use super::EventName;
use super::EventTarget;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("event")
        .invoke_handler(tauri::generate_handler![listen, unlisten])
        .setup(|app| {
            // Plugin setup logic if needed
            Ok(())
        })
        .build()
}
```

----------------------------------------

TITLE: Initialize Webview Window from Config
DESCRIPTION: Demonstrates creating a Webview window using a `WindowConfig` from `tauri.conf.json`. This is useful for pre-defined window configurations.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewWindowBuilder

LANGUAGE: rust
CODE:
```
#[tauri::command]
async fn reopen_window(app: tauri::AppHandle) {
  let webview_window = tauri::WebviewWindowBuilder::from_config(&app, &app.config().app.windows.get(0).unwrap())
    .unwrap()
    .build()
    .unwrap();
}
```

----------------------------------------

TITLE: Get macOS NSWindow Handle
DESCRIPTION: Returns the native NSWindow handle for macOS. This function is conditionally compiled for macOS and returns a raw pointer to the window's handle. It requires the window to be properly installed in a window hierarchy.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/window/mod.rs

LANGUAGE: rust
CODE:
```
pub fn ns_window(&self) -> crate::Result<*mut std::ffi::c_void> {
    self
      .window
      .dispatcher
      .window_handle()
      .map_err(Into::into)
      .and_then(|handle| {
        if let raw_window_handle::RawWindowHandle::AppKit(h) = handle.as_raw() {
          let view: &objc2_app_kit::NSView = unsafe { h.ns_view.cast().as_ref() };
          let ns_window = view.window().expect("view to be installed in window");
          Ok(objc2::rc::Retained::autorelease_ptr(ns_window).cast())
        } else {
          Err(crate::Error::InvalidWindowHandle)
        }
      })
}
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Rust Documentation Resources
DESCRIPTION: General resources for learning and using Rust, including the official website, book, standard library API, and more.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/webview_window.rs

LANGUAGE: Rust
CODE:
```
https://www.rust-lang.org/
```

LANGUAGE: Rust
CODE:
```
https://doc.rust-lang.org/book/
```

LANGUAGE: Rust
CODE:
```
https://doc.rust-lang.org/std/
```

LANGUAGE: Rust
CODE:
```
https://doc.rust-lang.org/rust-by-example/
```

LANGUAGE: Rust
CODE:
```
https://doc.rust-lang.org/cargo/guide/
```

LANGUAGE: Rust
CODE:
```
https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/ipc/command.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Modules Overview
DESCRIPTION: Lists the available modules within the Tauri framework, providing entry points to various functionalities like window management, IPC, and plugin system.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/menu/index

LANGUAGE: APIDOC
CODE:
```
Tauri Modules:

- async_runtime: For managing asynchronous operations.
- image: Utilities for image handling.
- ipc: Inter-process communication mechanisms.
- menu: For creating and managing application menus.
- path: Utilities for handling file paths.
- plugin: For extending Tauri with custom plugins.
- process: For interacting with system processes.
- scope: For defining and managing application scopes.
- test: Utilities for testing Tauri applications.
- tray: For managing system tray icons.
- webview: For interacting with the webview.
- window: For managing application windows.
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/path/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: SubmenuBuilder Example
DESCRIPTION: Provides an example of how to use the SubmenuBuilder to create a submenu in the Tauri application menu. This is a common pattern for organizing menu items.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/menu/struct.SubmenuBuilder

LANGUAGE: rust
CODE:
```
struct SubmenuBuilder {
    // Fields related to building a submenu
}

impl SubmenuBuilder {
    // Methods for adding items, setting title, etc.
    fn new() -> Self {
        // Constructor implementation
        unimplemented!()
    }

    fn build(self) -> Submenu {
        // Build the submenu
        unimplemented!()
    }
}
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/webview.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/resources/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Rust Resources
DESCRIPTION: Links to essential Rust documentation and resources, including The Book, Standard Library API Reference, and Cargo Guide.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Rust:
  Rust website
  The Book
  Standard Library API Reference
  Rust by Example
  The Cargo Guide
  Clippy Documentation
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/event/listener.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Builder API Documentation
DESCRIPTION: API documentation for the `tauri::Builder` struct, detailing methods for application setup, state management, menu configuration, and event handling.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/struct.Builder

LANGUAGE: APIDOC
CODE:
```
pub struct Builder<R = ()>

  pub fn default() -> Builder<()>
    Creates a new Builder.

  pub fn manage<M: Send + Sync + 'static>(self, state: M) -> Builder<R>
    Manages the given state.
    Parameters:
      state: The state to manage.

  pub fn invoke_handler<F>(self, f: F) -> Builder<R>
    Sets the invoke handler for the application.
    Parameters:
      f: The invoke handler function.

  pub fn run(self, context: TauriContext) -> Result<Application<R>>
    Runs the Tauri application.
    Parameters:
      context: The Tauri context.

  pub fn menu<F>(self, f: F) -> Builder<R>
    Sets the menu to use on all windows.
    Parameters:
      f: A closure that returns a Menu.

  pub fn on_menu_event<F>(self, f: F) -> Builder<R>
    Registers an event handler for any menu event.
    Parameters:
      f: A closure that handles menu events.

  pub fn on_tray_icon_event<F>(self, f: F) -> Builder<R>
    Registers an event handler for any tray icon event.
    Parameters:
      f: A closure that handles tray icon events.

  pub fn enable_macos_default_menu(self, enable: bool) -> Builder<R>
    Enable or disable the default menu on macOS.
    Parameters:
      enable: Whether to enable the default menu.
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/webview/mod.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/submenu.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Handle Webview Creation
DESCRIPTION: This snippet demonstrates the process of handling the creation of a webview. It involves calling an internal hook for platform-specific setup and emitting a 'tauri://webview-created' event with the webview's label.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/webview.rs

LANGUAGE: rust
CODE:
```
unsafe { crate::ios::on_webview_created(w.inner() as _, w.view_controller() as _) };
    }
    .expect("failed to run on_webview_created hook");

    let event = crate::EventName::from_str("tauri://webview-created");
    let payload = Some(crate::webview::CreatedEvent {
      label: webview.label().into(),
    });

    let _ = webview
      .manager
      .emit(event, EmitPayload::Serialize(&payload));
```

----------------------------------------

TITLE: Tauri Url Examples
DESCRIPTION: Demonstrates setting and unsetting the port for a URL, including handling potential errors and asserting the resulting URL string.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/struct.Url

LANGUAGE: rust
CODE:
```
use url::Url;


let mut url = Url::parse("ssh://example.net:2048/")?;

url.set_port(Some(4096)).map_err(|_| "cannot be base")?;
assert_eq!(url.as_str(), "ssh://example.net:4096/");

url.set_port(None).map_err(|_| "cannot be base")?;
assert_eq!(url.as_str(), "ssh://example.net/");

```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/builders/icon.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Event Unlistening Example
DESCRIPTION: An example demonstrating how to listen to an event, unlisten from it using the returned EventId, and also how to unlisten from an event within the handler itself.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.WebviewWindow

LANGUAGE: rust
CODE:
```
use tauri::{Manager, Listener};

tauri::Builder::default()
  .setup(|app| {
    let webview_window = app.get_webview_window("main").unwrap();
    let webview_window_ = webview_window.clone();
    let handler = webview_window.listen("component-loaded", move |event| {
      println!("webview_window just loaded a component");

      // we no longer need to listen to the event
      // we also could have used `webview_window.once` instead
      webview_window_.unlisten(event.id());
    });

    // stop listening to the event when you do not need it anymore
    webview_window.unlisten(handler);

    Ok(())
});

```

----------------------------------------

TITLE: Tauri Event Listener Setup
DESCRIPTION: Sets up event listeners for the application, a window, a webview, and a webview window. It uses a macro `setup_listener` to abstract the common logic for listening to specific events and any events. This function is crucial for handling inter-process communication and UI updates within a Tauri application.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/manager/mod.rs

LANGUAGE: rust
CODE:
```
fn setup_events(setup_any: bool) -> EventSetup {
    let app = mock_app();
    let window = WindowBuilder::new(&app, "main-window").build().unwrap();

    let webview = window
      .add_child(
        WebviewBuilder::new("main-webview", Default::default()),
        crate::LogicalPosition::new(0, 0),
        window.inner_size().unwrap(),
      )
      .unwrap();

    let webview_window = WebviewWindowBuilder::new(&app, "main-webview-window", Default::default())
      .build()
      .unwrap();

    let (tx, rx) = channel();

    macro_rules! setup_listener {
      ($type:ident, $id:ident, $any_id:ident) => {
        let tx_ = tx.clone();
        $type.listen(TEST_EVENT_NAME, move |evt| {
          tx_
            .send(($id, serde_json::from_str::<String>(evt.payload()).unwrap()))
            .unwrap();
        });

        if setup_any {
          let tx_ = tx.clone();
          $type.listen_any(TEST_EVENT_NAME, move |evt| {
            tx_
              .send((
                $any_id,
                serde_json::from_str::<String>(evt.payload()).unwrap(),
              ))
              .unwrap();
          });
        }
      };
    }

    setup_listener!(app, APP_LISTEN_ID, APP_LISTEN_ANY_ID);
    setup_listener!(window, WINDOW_LISTEN_ID, WINDOW_LISTEN_ANY_ID);
    setup_listener!(webview, WEBVIEW_LISTEN_ID, WEBVIEW_LISTEN_ANY_ID);
    setup_listener!(
      webview_window,
      WEBVIEW_WINDOW_LISTEN_ID,
      WEBVIEW_WINDOW_LISTEN_ANY_ID
    );

    EventSetup { rx }
}
```

----------------------------------------

TITLE: Tauri Plugin Initialization with Webview Ready Callback
DESCRIPTION: Demonstrates how to initialize a Tauri plugin and attach a callback that executes when a webview is ready. This callback prints the label of the created webview.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs

LANGUAGE: rust
CODE:
```
fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("example")
    .on_webview_ready(|webview| {
      println!("created webview {}", webview.label());
    })
    .build()
}
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Tray Module
DESCRIPTION: Documentation for the Tauri tray module, enabling the creation and management of system tray icons.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/test/mock_runtime.rs

LANGUAGE: APIDOC
CODE:
```
Tray Module:
  Provides functionalities for creating and managing application icons in the system tray.
  Allows interaction with the tray icon, such as displaying menus and handling clicks.

Source: [tray/mod.rs](https://docs.rs/tauri/2.7.0/src/tauri/tray/mod.rs.html)
Source: [tray/plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/tray/plugin.rs.html)
```

----------------------------------------

TITLE: JavaScript Invoke System Example
DESCRIPTION: An example JavaScript snippet demonstrating how to use the `__INVOKE_KEY__` for secure communication with the Tauri backend. It shows how to include the key in the request headers for integrity verification.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: javascript
CODE:
```
const invokeKey = __INVOKE_KEY__;
fetch('my-impl://command', {
  headers: {
    'Tauri-Invoke-Key': invokeKey,
  }
})
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/lib.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/check.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/icon.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/image/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/mod.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: ScopeObjectMatch Trait Example Implementation
DESCRIPTION: An example implementation of the `ScopeObjectMatch` trait for a `Scope` enum, demonstrating how to match against URL domains and string prefixes.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/ipc/trait.ScopeObjectMatch

LANGUAGE: rust
CODE:
```
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Scope {
  Domain(Url),
  StartsWith(String),
}

impl ScopeObjectMatch for Scope {
  type Input = str;

  fn matches(&self, input: &str) -> bool {
    match self {
      Scope::Domain(url) => {
        let parsed: Url = match input.parse() {
          Ok(parsed) => parsed,
          Err(_) => return false,
        };

        let domain = parsed.domain();

        domain.is_some() && domain == url.domain()
      }
      Scope::StartsWith(start) => input.starts_with(start),
    }
  }
}
```

----------------------------------------

TITLE: Rust Documentation Links
DESCRIPTION: A collection of useful links to official Rust documentation, including The Book, Standard Library API Reference, and Rust by Example.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/protocol/asset.rs

LANGUAGE: rust
CODE:
```
https://www.rust-lang.org/
https://doc.rust-lang.org/book/
https://doc.rust-lang.org/std/
https://doc.rust-lang.org/rust-by-example/
https://doc.rust-lang.org/cargo/guide/
https://doc.rust-lang.org/nightly/clippy
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/builders/check.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/builders/mod.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/window/mod.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri CommandScope Example Usage
DESCRIPTION: An example demonstrating how to use the `CommandScope` within a Tauri command. It shows how to check if the scope matches the input string before proceeding with the command's logic.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/ipc/struct.CommandScope

LANGUAGE: rust
CODE:
```
#[derive(Debug, Clone, Serialize, Deserialize)]
#[command]
fn my_command(scope: CommandScope<Scope>, input: String) -> Result<String, &'static str> {
  if scope.matches(&input) {
    do_work(input)
  } else {
    Err("Scope didn't match input")
  }
}
```

----------------------------------------

TITLE: TokioHandle runtime_flavor Examples
DESCRIPTION: Illustrates how to use TokioHandle::runtime_flavor to determine the flavor of the current Tokio Runtime. Examples are provided for both 'current_thread' and 'multi_thread' flavors.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/async_runtime/struct.TokioHandle

LANGUAGE: rust
CODE:
```
use tokio::runtime::{Handle, RuntimeFlavor};

#[tokio::main(flavor = "current_thread")]
async fn main() {
  assert_eq!(RuntimeFlavor::CurrentThread, Handle::current().runtime_flavor());
}
```

LANGUAGE: rust
CODE:
```
use tokio::runtime::{Handle, RuntimeFlavor};

#[tokio::main(flavor = "multi_thread", worker_threads = 4)]
async fn main() {
  assert_eq!(RuntimeFlavor::MultiThread, Handle::current().runtime_flavor());
}
```

----------------------------------------

TITLE: Rust Listener Trait Implementation Example
DESCRIPTION: Example of how to implement the Tauri Listener trait in Rust. This demonstrates the basic structure for defining event listening capabilities.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/trait.Listener

LANGUAGE: rust
CODE:
```
use tauri::{ManagerBase, Runtime, Event, EventId, Listener};

struct MyManager<R: Runtime> { /* fields */ }

impl<R: Runtime> ManagerBase<R> for MyManager<R> {
    // Implementation of ManagerBase methods
}

impl<R: Runtime> Listener<R> for MyManager<R> {
    fn listen<F>(&self, event: impl Into<String>, handler: F) -> EventId
    where
        F: Fn(Event<R>) + Send + 'static,
    {
        // Implementation to register a listener
        unimplemented!();
    }

    fn once<F>(&self, event: impl Into<String>, handler: F) -> EventId
    where
        F: FnOnce(Event<R>) + Send + 'static,
    {
        // Implementation to register a one-time listener
        unimplemented!();
    }

    fn unlisten(&self, id: EventId) {
        // Implementation to remove a listener
        unimplemented!();
    }
}
```

----------------------------------------

TITLE: Tauri Url make_relative Examples
DESCRIPTION: Provides examples for the `make_relative` method, which creates a relative URL from a base URL. This is the inverse operation of `join`. It demonstrates creating relative paths for various scenarios, including different path structures and query parameters.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/webview/struct.Url

LANGUAGE: rust
CODE:
```
use url::Url;

let base = Url::parse("https://example.net/a/b.html")?;
let url = Url::parse("https://example.net/a/c.png")?;
let relative = base.make_relative(&url);
assert_eq!(relative.as_ref().map(|s| s.as_str()), Some("c.png"));

let base = Url::parse("https://example.net/a/b/")?;
let url = Url::parse("https://example.net/a/b/c.png")?;
let relative = base.make_relative(&url);
assert_eq!(relative.as_ref().map(|s| s.as_str()), Some("c.png"));

let base = Url::parse("https://example.net/a/b/")?;
let url = Url::parse("https://example.net/a/d/c.png")?;
let relative = base.make_relative(&url);
assert_eq!(relative.as_ref().map(|s| s.as_str()), Some("../d/c.png"));

let base = Url::parse("https://example.net/a/b.html?c=d")?;
let url = Url::parse("https://example.net/a/b.html?e=f")?;
let relative = base.make_relative(&url);
assert_eq!(relative.as_ref().map(|s| s.as_str()), Some("?e=f"));
```

----------------------------------------

TITLE: Tauri 2.7.0 Project Overview
DESCRIPTION: This section outlines the Tauri 2.7.0 project, including its purpose, licensing, links to external resources, and a list of its dependencies. It serves as a high-level introduction to the framework.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/menu/predefined.rs

LANGUAGE: rust
CODE:
```
Project: /context7/rs-tauri-2.7.0

[ Docs.rs ](https://docs.rs/)
  * [ tauri-2.7.0 ](https://docs.rs/tauri/2.7.0/src/tauri/menu/predefined.rs.html "Make tiny, secure apps for all desktop platforms with Tauri")
    * tauri 2.7.0 
    * [ ](https://docs.rs/crate/tauri/2.7.0 "See tauri in docs.rs")
    * [Apache-2.0](https://spdx.org/licenses/Apache-2.0) OR [MIT](https://spdx.org/licenses/MIT)
    * Links
    * [ ](https://tauri.app/)
    * [ ](https://github.com/tauri-apps/tauri)
    * [ ](https://crates.io/crates/tauri "See tauri in crates.io")
    * [ ](https://docs.rs/crate/tauri/2.7.0/source/ "Browse source of tauri-2.7.0")
    * Owners
    * [ ](https://crates.io/users/tauri-bot)
    * Dependencies
    *       * [ anyhow ^1 _normal_ ](https://docs.rs/anyhow/^1)
      * [ data-url ^0.3 _normal_ _optional_ ](https://docs.rs/data-url/^0.3)
      * [ dirs ^6 _normal_ ](https://docs.rs/dirs/^6)
      * [ dunce ^1 _normal_ ](https://docs.rs/dunce/^1)
      * [ getrandom ^0.3 _normal_ ](https://docs.rs/getrandom/^0.3)
      * [ glob ^0.3 _normal_ ](https://docs.rs/glob/^0.3)
      * [ heck ^0.5 _normal_ ](https://docs.rs/heck/^0.5)
      * [ http ^1 _normal_ ](https://docs.rs/http/^1)
      * [ http-range ^0.1 _normal_ _optional_ ](https://docs.rs/http-range/^0.1)
      * [ image ^0.25 _normal_ _optional_ ](https://docs.rs/image/^0.25)
      * [ log ^0.4.21 _normal_ ](https://docs.rs/log/^0.4.21)
      * [ mime ^0.3 _normal_ ](https://docs.rs/mime/^0.3)
      * [ percent-encoding ^2 _normal_ ](https://docs.rs/percent-encoding/^2)
      * [ raw-window-handle ^0.6 _normal_ ](https://docs.rs/raw-window-handle/^0.6)
      * [ serde ^1 _normal_ ](https://docs.rs/serde/^1)
      * [ serde_json ^1 _normal_ ](https://docs.rs/serde_json/^1)
      * [ serde_repr ^0.1 _normal_ ](https://docs.rs/serde_repr/^0.1)
      * [ serialize-to-javascript =0.1.1 _normal_ ](https://docs.rs/serialize-to-javascript/=0.1.1)
      * [ specta ^2.0.0-rc.16 _normal_ _optional_ ](https://docs.rs/specta/^2.0.0-rc.16)
      * [ tauri-macros ^2.3.2 _normal_ ](https://docs.rs/tauri-macros/^2.3.2)
      * [ tauri-runtime ^2.7.1 _normal_ ](https://docs.rs/tauri-runtime/^2.7.1)
      * [ tauri-runtime-wry ^2.7.2 _normal_ _optional_ ](https://docs.rs/tauri-runtime-wry/^2.7.2)
      * [ tauri-utils ^2.6.0 _normal_ ](https://docs.rs/tauri-utils/^2.6.0)
      * [ thiserror ^2 _normal_ ](https://docs.rs/thiserror/^2)
      * [ tokio ^1 _normal_ ](https://docs.rs/tokio/^1)
      * [ tracing ^0.1 _normal_ _optional_ ](https://docs.rs/tracing/^0.1)
      * [ url ^2 _normal_ ](https://docs.rs/url/^2)
      * [ urlpattern ^0.3 _normal_ ](https://docs.rs/urlpattern/^0.3)
      * [ uuid ^1 _normal_ _optional_ ](https://docs.rs/uuid/^1)
      * [ cargo_toml ^0.22 _dev_ ](https://docs.rs/cargo_toml/^0.22)
      * [ http-range ^0.1.5 _dev_ ](https://docs.rs/http-range/^0.1.5)
      * [ proptest ^1.6.0 _dev_ ](https://docs.rs/proptest/^1.6.0)
      * [ quickcheck ^1.0.3 _dev_ ](https://docs.rs/quickcheck/^1.0.3)
      * [ quickcheck_macros ^1.0.0 _dev_ ](https://docs.rs/quickcheck_macros/^1.0.0)
      * [ serde ^1 _dev_ ](https://docs.rs/serde/^1)
      * [ serde_json ^1 _dev_ ](https://docs.rs/serde_json/^1)
      * [ tokio ^1 _dev_ ](https://docs.rs/tokio/^1)
      * [ glob ^0.3 _build_ ](https://docs.rs/glob/^0.3)
      * [ heck ^0.5 _build_ ](https://docs.rs/heck/^0.5)
      * [ tauri-build ^2.3.1 _build_ ](https://docs.rs/tauri-build/^2.3.1)
      * [ tauri-utils ^2.6.0 _build_ ](https://docs.rs/tauri-utils/^2.6.0)
      * [ libc ^0.2 _normal_ ](https://docs.rs/libc/^0.2)
      * [ objc2-ui-kit ^0.3.0 _normal_ ](https://docs.rs/objc2-ui-kit/^0.3.0)
      * [ swift-rs ^1 _normal_ ](https://docs.rs/swift-rs/^1)
      * [ bytes ^1 _normal_ ](https://docs.rs/bytes/^1)
      * [ reqwest ^0.12 _normal_ ](https://docs.rs/reqwest/^0.12)
      * [ gtk ^0.18 _normal_ ](https://docs.rs/gtk/^0.18)
      * [ webkit2gtk =2.0.1 _normal_ _optional_ ](https://docs.rs/webkit2gtk/=2.0.1)
      * [ muda ^0.17 _normal_ ](https://docs.rs/muda/^0.17)
      * [ tray-icon ^0.21 _normal_ _optional_ ](https://docs.rs/tray-icon/^0.21)
      * [ jni ^0.21 _normal_ ](https://docs.rs/jni/^0.21)
      * [ embed_plist ^1.2 _normal_ ](https://docs.rs/embed_plist/^1.2)
      * [ objc2-app-kit ^0.3 _normal_ ](https://docs.rs/objc2-app-kit/^0.3)
      * [ objc2-foundation ^0.3 _normal_ ](https://docs.rs/objc2-foundation/^0.3)
      * [ plist ^1 _normal_ ](https://docs.rs/plist/^1)
      * [ window-vibrancy ^0.6 _normal_ ](https://docs.rs/window-vibrancy/^0.6)
      * [ objc2-web-kit ^0.3 _dev_ ](https://docs.rs/objc2-web-kit/^0.3)
      * [ objc2 ^0.6 _normal_ ](https://docs.rs/objc2/^0.6)
      * [ webview2-com ^0.38 _normal_ _optional_ ](https://docs.rs/webview2-com/^0.38)
      * [ window-vibrancy ^0.6 _normal_ ](https://docs.rs/window-vibrancy/^0.6)
      * [ windows ^0.61 _normal_ ](https://docs.rs/windows/^0.61)
    * Versions
    * [ **100%** of the crate is documented ](https://docs.rs/crate/tauri/2.7.0)
```

----------------------------------------

TITLE: Tauri IPC Response Assertion Example
DESCRIPTION: A comprehensive example demonstrating how to use `assert_ipc_response` to test a Tauri command. It includes setting up a mock application, creating a webview, and invoking a command with an expected response.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/test/fn.assert_ipc_response

LANGUAGE: rust
CODE:
```
use tauri::test::{mock_builder, mock_context, noop_assets};

#[tauri::command]
fn ping() -> &'static str {
    "pong"
}

fn create_app<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::App<R> {
    builder
        .invoke_handler(tauri::generate_handler![ping])
        // remove the string argument to use your app's config file
        .build(tauri::generate_context!("test/fixture/src-tauri/tauri.conf.json"))
        .expect("failed to build app")
}

fn main() {
    let app = create_app(mock_builder());
    let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default()).build().unwrap();

    // run the `ping` command and assert it returns `pong`
    tauri::test::assert_ipc_response(
        &webview,
        tauri::webview::InvokeRequest {
            cmd: "ping".into(),
            callback: tauri::ipc::CallbackFn(0),
            error: tauri::ipc::CallbackFn(1),
            url: "http://tauri.localhost".parse().unwrap(),
            body: tauri::ipc::InvokeBody::default(),
            headers: Default::default(),
            invoke_key: tauri::test::INVOKE_KEY.to_string(),
        },
      Ok("pong")
    );
}
```

----------------------------------------

TITLE: MockRuntime Initialization
DESCRIPTION: Demonstrates the initialization of the MockRuntime, setting up its internal state including the running status, context, and message receiver. This is crucial for setting up a test environment.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/test/mock_runtime.rs

LANGUAGE: rust
CODE:
```
#[derive(Debug)]
pub struct MockRuntime {
  is_running: Arc<AtomicBool>,
  pub context: RuntimeContext,
  run_rx: Receiver<Message>,
}

impl MockRuntime {
  fn init() -> Self {
    let is_running = Arc::new(AtomicBool::new(false));
    let (tx, rx) = sync_channel(256);
    let context = RuntimeContext {
      is_running: is_running.clone(),
      windows: Default::default(),
      shortcuts: Default::default(),
      run_tx: tx,
      next_window_id: Default::default(),
      next_webview_id: Default::default(),
      next_window_event_id: Default::default(),
      next_webview_event_id: Default::default(),
    };
    Self {
      is_running,
      context,
      run_rx: rx,
    }
  }
}
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/scope/fs.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Runtime Initialization (Linux/Windows)
DESCRIPTION: Initializes the Tauri runtime, with platform-specific arguments. This example shows the conditional initialization for Windows and Linux systems.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/app.rs

LANGUAGE: rust
CODE:
```
let mut runtime = if self.runtime_any_thread {
  R::new_any_thread(runtime_args)?
} else {
  // ... other initialization logic
};
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/path/mod.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Plugin Initialization and Lifecycle
DESCRIPTION: This section covers the core methods for initializing a Tauri plugin and handling lifecycle events. The `initialize` method is crucial for setting up the plugin with the application's context. `window_created` and `webview_created` allow for specific actions when windows or webviews are instantiated.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/plugin/trait.Plugin

LANGUAGE: APIDOC
CODE:
```
fn initialize(&mut self, app: &AppHandle<R>, config: JsonValue) -> Result<(), Box<dyn Error>>
  - Initializes the plugin with the application handle and configuration.
  - Parameters:
    - app: A handle to the Tauri application.
    - config: A JSON value representing the plugin's configuration.
  - Returns: A Result indicating success or failure during initialization.

fn window_created(&mut self, window: Window<R>)
  - Callback invoked when a new window is created.
  - Parameters:
    - window: The newly created Window object.

fn webview_created(&mut self, webview: Webview<R>)
  - Callback invoked when a new webview is created.
  - Parameters:
    - webview: The newly created Webview object.
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/resources/mod.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/event/plugin.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/state.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```

----------------------------------------

TITLE: Using Icon as Template (Rust)
DESCRIPTION: Example of setting an icon to be used as a template on macOS.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/tray/struct.TrayIconBuilder

LANGUAGE: rust
CODE:
```
use tauri::image::Image;
use tauri::tray::TrayIconBuilder;

// Placeholder for actual icon loading
let icon = Image::default(); // Replace with actual image loading

TrayIconBuilder::new()
    .icon(icon)
    .icon_as_template(true) // Use icon as template on macOS
    .build()
    .unwrap();
```

----------------------------------------

TITLE: Tauri State Management Examples
DESCRIPTION: Provides examples of managing custom state types (`MyInt`, `MyString`) within a Tauri application. It shows how to register state using `tauri::Builder::default().setup()`, access it within commands, and retrieve it using `app.state()`.

SOURCE: https://docs.rs/tauri/2.7.0/tauri/trait.Manager

LANGUAGE: rust
CODE:
```
use tauri::{Manager, State};

struct MyInt(isize);
struct MyString(String);

#[tauri::command]
fn int_command(state: State<MyInt>) -> String {
    format!("The stateful int is: {}", state.0)
}

#[tauri::command]
fn string_command<'r>(state: State<'r, MyString>) {
    println!("state: {}", state.inner().0);
}

tauri::Builder::default()
  .setup(|app| {
    app.manage(MyInt(0));
    app.manage(MyString("tauri".into()));
    // `MyInt` is already managed, so `manage()` returns false
    assert!(!app.manage(MyInt(1)));
    // read the `MyInt` managed state with the turbofish syntax
    let int = app.state::<MyInt>();
    assert_eq!(int.0, 0);
    // read the `MyString` managed state with the `State` guard
    let val: State<MyString> = app.state();
    assert_eq!(val.0, "tauri");
    Ok(())
  })
  .invoke_handler(tauri::generate_handler![int_command, string_command])
  // on an actual app, remove the string argument
  .run(tauri::generate_context!("test/fixture/src-tauri/tauri.conf.json"))
  .expect("error while running tauri application");

```

----------------------------------------

TITLE: Tauri Core API
DESCRIPTION: Documentation for core Tauri functionalities including application setup, async runtime, error handling, patterns, plugins, process management, and state management.

SOURCE: https://docs.rs/tauri/2.7.0/src/tauri/protocol/tauri.rs

LANGUAGE: APIDOC
CODE:
```
Tauri Core API:
  This module encompasses fundamental aspects of the Tauri framework, enabling the creation and management of cross-platform applications.

Key Components:
  - `app.rs`: Core application logic and setup.
  - `async_runtime.rs`: Utilities for managing asynchronous operations.
  - `error.rs`: Defines error types and handling mechanisms.
  - `lib.rs`: The main library entry point and core exports.
  - `pattern.rs`: Implements design patterns used within Tauri.
  - `plugin.rs`: Core plugin system functionalities.
  - `process.rs`: Utilities for managing application processes.
  - `state.rs`: Mechanisms for managing application state.

Source: [app.rs](https://docs.rs/tauri/2.7.0/src/tauri/app.rs.html)
Source: [async_runtime.rs](https://docs.rs/tauri/2.7.0/src/tauri/async_runtime.rs.html)
Source: [error.rs](https://docs.rs/tauri/2.7.0/src/tauri/error.rs.html)
Source: [lib.rs](https://docs.rs/tauri/2.7.0/src/tauri/lib.rs.html)
Source: [pattern.rs](https://docs.rs/tauri/2.7.0/src/tauri/pattern.rs.html)
Source: [plugin.rs](https://docs.rs/tauri/2.7.0/src/tauri/plugin.rs.html)
Source: [process.rs](https://docs.rs/tauri/2.7.0/src/tauri/process.rs.html)
Source: [state.rs](https://docs.rs/tauri/2.7.0/src/tauri/state.rs.html)
```