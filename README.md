# GOV.UK Prototype Builder

A drag-and-drop page builder for the [GOV.UK Design System](https://design-system.service.gov.uk/). Build pages visually, then copy the generated Nunjucks views and JavaScript routes into a [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/) project.

It works a bit like Figma for GOV.UK pages: pick components, arrange them on a canvas, edit their content, and get code that follows the Design System's own markup and macros.

> **Status:** an early tool with no build step. It is not affiliated with or endorsed by the Government Digital Service (GDS). Always check generated code against the current Design System guidance.

---

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [Using the builder](#using-the-builder)
- [Using the output in the Prototype Kit](#using-the-output-in-the-prototype-kit)
- [Components](#components)
- [Pages and routes](#pages-and-routes)
- [Project structure](#project-structure)
- [Adding or changing a component](#adding-or-changing-a-component)
- [Known limitations](#known-limitations)
- [Licence and attribution](#licence-and-attribution)

---

## Features

- **Drag and drop** components from a palette onto a canvas, and drag items on the canvas to reorder them.
- **Edit properties** (text, hints, field names, options and so on) in a side panel with a live preview.
- **Nunjucks output** for the Prototype Kit, using the official `govuk/components/.../macro.njk` macros. Only the macros you use are imported.
- **Plain HTML output** using the standard GOV.UK markup.
- **Multiple pages**, each with its own components, title and name.
- **Flow view:** see every screen as a card and wire them together with arrows. Connections set the same next-page and branching settings that generate your routes.
- **JavaScript routes** (`app/routes.js`) generated for every page that has a form, including branching on radio answers.
- **Layout-aware output:** components such as the header, footer, skip link, cookie banner, breadcrumbs and phase banner are placed in the correct Prototype Kit layout block (`header`, `footer`, `skipLink`, `bodyStart`, `beforeContent`).
- **Guidance links:** a **?** button next to each component and a link in the properties panel open the matching Design System page. The Nunjucks output also includes a comment with each component's guidance URL.
- **Full-flow export:** download every screen and the routes as a `.zip`, or copy a single setup script that writes them into your Prototype Kit project.
- **Autosave** in your browser's local storage.
- **No build step and no dependencies.**

## Getting started

The app is five files: `index.html` (markup), `styles.css`, `flow.js`, `export.js` and `app.js`. Keep them in the same folder; there is nothing else to install.

1. Open `index.html` in a modern browser (Chrome, Edge, Firefox or Safari), or host the folder anywhere that serves static files.
2. Start building.

You will also need a Prototype Kit project to use the output. To create one:

```bash
npx govuk-prototype-kit create my-prototype
cd my-prototype
npm start
```

See the [Prototype Kit documentation](https://prototype-kit.service.gov.uk/docs/) for details and version requirements.

## Using the builder

The screen has three panels.

| Panel | What it does |
| --- | --- |
| **Left: components** | The palette, grouped into Content, Form, Navigation and Page layout. Drag a component onto the canvas, or click it (or press Enter) to add it to the end of the page. The **?** button opens that component's Design System guidance in a new tab. |
| **Middle: canvas** | A preview of the current page, with a row of page buttons above it. Click an item to select it. Drag to reorder. Switch to **Flow** with the toggle above the canvas to wire screens together. |
| **Right: sidebar** | Five tabs: **Properties**, **Nunjucks**, **HTML**, **Routes** and **Export**. |

**Properties** shows page settings (title, name, where the form goes next, and branching) followed by the fields for the selected component. Use **Move up**, **Move down**, **Duplicate** and **Delete** to manage the selected item. Move up and down also work on touch devices where dragging is awkward.

**Nunjucks, HTML and Routes** show generated code with a **Copy to clipboard** button. If the clipboard is unavailable, select the text in the box and copy it manually.

## Using the output in the Prototype Kit

For each page you build:

1. Open the **Nunjucks** tab for that page and copy the code.
2. Save it as `app/views/<page-name>.html` in your Prototype Kit project. The label above the code box shows the file name.
3. Open the **Routes** tab and copy the code into `app/routes.js`.
4. Run the kit (`npm start`) and visit `/<page-name>`.

A generated page looks like this:

```njk
{% extends "layouts/main.html" %}

{% from "govuk/components/radios/macro.njk" import govukRadios %}
{% from "govuk/components/button/macro.njk" import govukButton %}

{% block pageTitle %}
  Page title
{% endblock %}

{% block content %}
<div class="govuk-grid-row">
  <div class="govuk-grid-column-two-thirds">
    <form method="post" novalidate>
      {# Radios: https://design-system.service.gov.uk/components/radios/ #}
      {{ govukRadios({ ... }) }}

      {{ govukButton({ text: "Continue" }) }}
    </form>
  </div>
</div>
{% endblock %}
```

The generated code targets `layouts/main.html` and the `govuk-prototype-kit` router API found in recent Prototype Kit versions. If you use an older version, you may need to adjust the layout name, import paths or router setup.

## Exporting a full flow

The **Export** tab bundles the whole flow, so you do not need to copy each page by hand. It lists the files it will create:

- `app/views/<page-name>.html` for every screen
- `app/flow-routes.js` with the routes for the whole flow

Choose one of two ways to get them into your project:

1. **Download .zip.** Unzip it and copy the `app` folder into your Prototype Kit project. Then add this line to `app/routes.js`:

   ```js
   require('./flow-routes')
   ```

2. **Copy setup script.** Paste it into a file called `import-flow.js` in your project's root folder and run `node import-flow.js`. It writes every file, reports which ones it replaced, and adds the `require` line to `app/routes.js` if it is not already there. Running it again is safe.

Routes go in their own file, so your existing `app/routes.js` is never overwritten. Exporting replaces any existing view with the same name, so rename screens if you do not want that. The tab warns you if two screens share a name.

Browsers can block downloads on some hosted pages. If the zip does not download, use the setup script, which only needs the clipboard.

## Components

All components from the GOV.UK Design System are included, plus Heading and Paragraph from the Styles section.

| Group | Components |
| --- | --- |
| **Content** | Heading, Paragraph, Accordion, Details, Inset text, Notification banner, Panel, Summary list, Table, Tabs, Tag, Task list, Warning text |
| **Form** | Text input, Textarea, Character count, Radios, Checkboxes, Select, Date input, File upload, Password input, Fieldset, Button, Error message, Error summary |
| **Navigation** | Back link, Breadcrumbs, Pagination, Service navigation, Skip link, Exit this page |
| **Page layout** | Header, Footer, Phase banner, Cookie banner |

Components that take several rows or items (accordion, table, tabs, task list, summary list, breadcrumbs, footer links) are edited as lines of text, with the format shown in the field label, for example `heading | content`. For tables, the first line is the header row.

## Pages and routes

- Use **+ Add page** above the canvas to create a page. Click a page button to switch to it.
- In **Properties → Page settings**:
  - **Page name** sets both the route and the view file name.
  - **After the form is submitted, go to** sets the default next page.
  - For each option of a radios component, an **if answer is …, go to** setting lets you branch the journey.
  - **Delete this page** removes the page and clears any links that pointed to it.
- Links between pages are stored by page, not by name, so renaming a page does not break them.

### Flow view

Use the **Editor / Flow** toggle above the canvas.

- Each page is a card. Drag a card to move it, click it to select the page, or press **Edit** to open it in the editor. **Tidy up** resets the layout.
- Each card has an output dot for **Next screen**. If the page has a radios component, it also has one dot per answer (**If Yes**, **If No** and so on), shown as orange arrows.
- Drag from a dot onto another card to connect them. Click the **×** on an arrow to remove it.
- Connections are the same settings as **Page settings** in the Properties tab, so changing one updates the other.
- If you connect from a page with no form field or button, a **Continue** button is added so the page can submit.

The **Routes** tab generates one `router.post` for each page that contains a form field or a button. For example:

```js
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Do you have a UK passport?
router.post('/passport', function (req, res) {
  if (req.session.data["passport"] === "no") {
    return res.redirect('/other-documents')
  }
  res.redirect('/check-your-answers')
})
```

Pages without a form need no route, because the Prototype Kit serves `app/views/<name>.html` automatically. A page with a form but no next page set redirects back to itself.

Pages that contain a button are wrapped in `<form method="post" novalidate>`, so a button-only page can move on to the next page.

## Project structure

```
.
├── index.html    # Page markup
├── styles.css    # Builder interface styles and the GOV.UK preview styles
├── flow.js       # Flow view: cards, wires and dragging (loaded before app.js)
├── export.js     # Export tab: zip download and setup script (loaded before app.js)
├── app.js        # All of the JavaScript
└── README.md
```

`styles.css` has two parts: the interface of the builder itself, and the approximate GOV.UK styling used for the canvas preview (starting at the `GOV.UK-style preview` comment).

`flow.js` and `export.js` must load before `app.js`, because `app.js` calls their render functions. They all read the shared `state` object.

Inside `app.js`:

| Part | Purpose |
| --- | --- |
| `COMPONENTS = { ... }` | The component registry: definitions, properties and code generators |
| `state` | App state: pages, current page, selected item and active tab |
| `generateNunjucks()`, `generateHtml()`, `generateRoutes()` | Code generators for the three output tabs |
| `renderPalette()`, `renderCanvas()`, `renderProperties()`, `renderPageBar()` | Rendering for the palette, canvas, properties panel and page bar |
| Event listeners | Drag and drop, clicks, keyboard and input handling |

## Adding or changing a component

Every component is an entry in the `COMPONENTS` object. For example:

```js
inset: {
  n: 'Inset text',                       // name shown in the palette
  g: 'Content',                          // palette group
  m: ['govukInsetText', 'inset-text'],   // [macro name, macro folder] for the import
  p: [['text', 'Text', 'Default text', 'area']],  // editable properties
  h: p => `<div class="govuk-inset-text">${escapeHtml(p.text)}</div>`,   // HTML and preview
  j: p => `{{ govukInsetText({ text: ${quote(p.text)} }) }}`             // Nunjucks macro call
}
```

| Key | Meaning |
| --- | --- |
| `n` | Display name |
| `g` | Palette group: `Content`, `Form`, `Navigation` or `Page layout` (add the group name to the list in `renderPalette()` if you create a new one) |
| `m` | `[macroName, folderName]`. Omit for components with no macro, such as Heading |
| `p` | Properties as `[key, label, default, type]`. `type` can be omitted (single-line text), `'area'` (multi-line text) or an array of options (a select) |
| `h` | Returns the HTML used for both the canvas preview and the HTML tab |
| `j` | Returns the Nunjucks macro call. If omitted, `h` is used |
| `f` | Set to `1` if the component is a form field, which wraps the page in a `<form>` |
| `blk` | The Prototype Kit layout block for the component, if it is not part of the main content (`skipLink`, `bodyStart`, `header`, `beforeContent` or `footer`) |

Helpers available to generators include `escapeHtml()`, `quote()` (quote a value for Nunjucks), `slugify()`, `splitLines()`, `splitPairs()` (split `a | b` lines) and `labelHtml()`, `hintHtml()`, `formGroup()` for form labels, hints and groups.

If you add a component, also add its CSS to the preview styles in `styles.css` so it renders sensibly on the canvas.

## Known limitations

- **The preview is an approximation.** GOV.UK Frontend's CSS and the GDS Transport font are not loaded, so the canvas uses simplified styles and Arial. Your prototype will look correct once the code runs inside the kit.
- **Component code has been written to follow the Design System's markup and macros, but not tested against every version of GOV.UK Frontend.** Check the output in your own prototype, and compare against the guidance page for each component.
- **Simplified HTML for some components.** For example, the header's HTML export uses a text logo. The Nunjucks macro (`govukHeader`) produces the real crown logo.
- **One page of Nunjucks at a time.** There is no "export everything" button yet. Copy each page's code into its own file.
- **No error states or conditional reveals.** Form components are built in their default state.
- **File upload forms** need `enctype="multipart/form-data"`, which is not added automatically.
- **No nesting or columns.** Components are stacked in a single column inside a two-thirds grid.
- **No undo or redo.**
- **Data lives in one browser.** Work is stored in local storage, so it does not sync between devices and is lost if you clear site data. Copy your code out regularly.
- **Branching** is supported for radios only, not for checkboxes or other answers.

## Licence and attribution

- The GOV.UK Design System, GOV.UK Frontend and the GOV.UK Prototype Kit are maintained by the Government Digital Service. GOV.UK Frontend and the Prototype Kit are released under the MIT licence. Design System content is Crown copyright, available under the Open Government Licence v3.0 unless stated otherwise. Check [the Design System's licence information](https://design-system.service.gov.uk/) for the latest terms.
- This builder is an independent tool and is not an official GOV.UK product. The GOV.UK logo, crown and brand are subject to Crown copyright and government branding rules.
- Choose and add a licence for this project before sharing it more widely.
