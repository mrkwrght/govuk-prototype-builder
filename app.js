// ---------- String helpers used by the code generators ----------
const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const quote = s => JSON.stringify(String(s));

const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';

const splitLines = s => String(s).split('\n').map(x => x.trim()).filter(Boolean);

// ---------- HTML and Nunjucks builders shared by several components ----------
const labelHtml = (t, n, z = 's') => `<label class="govuk-label govuk-label--${z}" for="${n}">${escapeHtml(t)}</label>`;

const hintHtml = (t, n) => t ? `<div id="${n}-hint" class="govuk-hint">${escapeHtml(t)}</div>` : '';

const hintMacro = t => t ? `  hint: { text: ${quote(t)} },\n` : '';

const choiceItemsHtml = (o, n, ty, cls) => splitLines(o).map((x, i) => `<div class="govuk-${cls}__item"><input class="govuk-${cls}__input" id="${n}-${i + 1}" name="${n}" type="${ty}" value="${slugify(x)}"><label class="govuk-label govuk-${cls}__label" for="${n}-${i + 1}">${escapeHtml(x)}</label></div>`).join('');

const choiceItemsMacro = o => `  items: [\n${splitLines(o).map(x => `    { value: ${quote(slugify(x))}, text: ${quote(x)} }`).join(',\n')}\n  ]`;

const choiceGroupHtml = (p, cls, ty) => `<div class="govuk-form-group"><fieldset class="govuk-fieldset"><legend class="govuk-fieldset__legend govuk-fieldset__legend--m">${escapeHtml(p.legend)}</legend>${hintHtml(p.hint, p.name)}<div class="govuk-${cls}" data-module="govuk-${cls}">${choiceItemsHtml(p.options, p.name, ty, cls)}</div></fieldset></div>`;

const choiceGroupMacro = (m, p) => `{{ ${m}({\n  name: ${quote(p.name)},\n  fieldset: { legend: { text: ${quote(p.legend)}, classes: "govuk-fieldset__legend--m" } },\n${hintMacro(p.hint)}${choiceItemsMacro(p.options)}\n}) }}`;

const fieldHtml = (p, tag) => `<div class="govuk-form-group">${labelHtml(p.label, p.name)}${hintHtml(p.hint, p.name)}<${tag} class="govuk-${tag}" id="${p.name}" name="${p.name}"${tag == 'input' ? ' type="text"' : ''}${p.hint ? ` aria-describedby="${p.name}-hint"` : ''}>${tag == 'input' ? '' : '</textarea>'}</div>`;

const fieldMacro = (m, p) => `{{ ${m}({\n  label: { text: ${quote(p.label)}, classes: "govuk-label--s" },\n${hintMacro(p.hint)}  id: ${quote(p.name)},\n  name: ${quote(p.name)}\n}) }}`;

const LABEL_PROP = ['label', 'Label', 'Your answer'], NAME_PROP = ['name', 'Name (id)', 'field-name'], HINT_PROP = ['hint', 'Hint (optional)', ''];

// ---------- Component registry ----------
// Each entry describes one GOV.UK component:
//   n   display name            g    palette group
//   m   [macro, folder]         p    editable properties [key, label, default, type]
//   h   returns HTML (preview and HTML tab)   j   returns the Nunjucks macro call
//   f   1 = form field          blk  Prototype Kit layout block, if not main content
const COMPONENTS = {
    heading: {
        n: 'Heading',
        g: 'Content',
        p: [['text', 'Text', 'Apply for a licence'], ['size', 'Size', 'l', ['xl', 'l', 'm']]],
        h: p => `<h1 class="govuk-heading-${p.size}">${escapeHtml(p.text)}</h1>`
    },
    paragraph: {
        n: 'Paragraph',
        g: 'Content',
        p: [['text', 'Text', 'Use this service to apply online. It takes about 10 minutes.', 'area']],
        h: p => `<p class="govuk-body">${escapeHtml(p.text)}</p>`
    },
    inset: {
        n: 'Inset text',
        g: 'Content',
        m: ['govukInsetText', 'inset-text'],
        p: [['text', 'Text', 'You can apply up to 3 months before your current licence expires.', 'area']],
        h: p => `<div class="govuk-inset-text">${escapeHtml(p.text)}</div>`,
        j: p => `{{ govukInsetText({ text: ${quote(p.text)} }) }}`
    },
    warning: {
        n: 'Warning text',
        g: 'Content',
        m: ['govukWarningText', 'warning-text'],
        p: [['text', 'Text', 'You could be fined if you do not apply in time.']],
        h: p => `<div class="govuk-warning-text"><span class="govuk-warning-text__icon" aria-hidden="true">!</span><strong class="govuk-warning-text__text"><span class="govuk-visually-hidden">Warning</span>${escapeHtml(p.text)}</strong></div>`,
        j: p => `{{ govukWarningText({ text: ${quote(p.text)}, iconFallbackText: "Warning" }) }}`
    },
    notification: {
        n: 'Notification banner',
        g: 'Content',
        m: ['govukNotificationBanner', 'notification-banner'],
        p: [['title', 'Title', 'Important'], ['text', 'Text', 'Your application has been saved.']],
        h: p => `<div class="govuk-notification-banner" role="region" aria-labelledby="govuk-notification-banner-title" data-module="govuk-notification-banner"><div class="govuk-notification-banner__header"><h2 class="govuk-notification-banner__title" id="govuk-notification-banner-title">${escapeHtml(p.title)}</h2></div><div class="govuk-notification-banner__content"><p class="govuk-notification-banner__heading">${escapeHtml(p.text)}</p></div></div>`,
        j: p => `{{ govukNotificationBanner({\n  titleText: ${quote(p.title)},\n  text: ${quote(p.text)}\n}) }}`
    },
    tag: {
        n: 'Tag',
        g: 'Content',
        m: ['govukTag', 'tag'],
        p: [['text', 'Text', 'In progress'], ['colour', 'Colour', 'blue', ['grey', 'green', 'blue', 'red', 'yellow']]],
        h: p => `<strong class="govuk-tag govuk-tag--${p.colour}">${escapeHtml(p.text)}</strong>`,
        j: p => `{{ govukTag({ text: ${quote(p.text)}, classes: "govuk-tag--${p.colour}" }) }}`
    },
    details: {
        n: 'Details',
        g: 'Content',
        m: ['govukDetails', 'details'],
        p: [['summary', 'Summary', 'Help with nationality'], ['text', 'Content', 'We need this to check your eligibility.', 'area']],
        h: p => `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">${escapeHtml(p.summary)}</span></summary><div class="govuk-details__text">${escapeHtml(p.text)}</div></details>`,
        j: p => `{{ govukDetails({\n  summaryText: ${quote(p.summary)},\n  text: ${quote(p.text)}\n}) }}`
    },
    input: {
        n: 'Text input',
        g: 'Form',
        f: 1,
        m: ['govukInput', 'input'],
        p: [LABEL_PROP, NAME_PROP, HINT_PROP],
        h: p => fieldHtml(p, 'input'),
        j: p => fieldMacro('govukInput', p)
    },
    textarea: {
        n: 'Textarea',
        g: 'Form',
        f: 1,
        m: ['govukTextarea', 'textarea'],
        p: [['label', 'Label', 'Tell us more'], NAME_PROP, HINT_PROP],
        h: p => fieldHtml(p, 'textarea'),
        j: p => fieldMacro('govukTextarea', p)
    },
    radios: {
        n: 'Radios',
        g: 'Form',
        f: 1,
        m: ['govukRadios', 'radios'],
        p: [['legend', 'Question', 'Do you have a UK passport?'], ['name', 'Name', 'passport'], HINT_PROP, ['options', 'Options (one per line)', 'Yes\nNo', 'area']],
        h: p => choiceGroupHtml(p, 'radios', 'radio'),
        j: p => choiceGroupMacro('govukRadios', p)
    },
    checkboxes: {
        n: 'Checkboxes',
        g: 'Form',
        f: 1,
        m: ['govukCheckboxes', 'checkboxes'],
        p: [['legend', 'Question', 'What do you need?'], ['name', 'Name', 'needs'], HINT_PROP, ['options', 'Options (one per line)', 'Passport\nDriving licence\nBirth certificate', 'area']],
        h: p => choiceGroupHtml(p, 'checkboxes', 'checkbox'),
        j: p => choiceGroupMacro('govukCheckboxes', p)
    },
    select: {
        n: 'Select',
        g: 'Form',
        f: 1,
        m: ['govukSelect', 'select'],
        p: [['label', 'Label', 'Sort by'], ['name', 'Name', 'sort'], ['options', 'Options (one per line)', 'Recently updated\nRecently published\nMost views', 'area']],
        h: p => `<div class="govuk-form-group">${labelHtml(p.label, p.name)}<select class="govuk-select" id="${p.name}" name="${p.name}">${splitLines(p.options).map(o => `<option value="${slugify(o)}">${escapeHtml(o)}</option>`).join('')}</select></div>`,
        j: p => `{{ govukSelect({\n  id: ${quote(p.name)},\n  name: ${quote(p.name)},\n  label: { text: ${quote(p.label)}, classes: "govuk-label--s" },\n${choiceItemsMacro(p.options)}\n}) }}`
    },
    button: {
        n: 'Button',
        g: 'Form',
        m: ['govukButton', 'button'],
        p: [['text', 'Text', 'Continue']],
        h: p => `<button type="submit" class="govuk-button" data-module="govuk-button">${escapeHtml(p.text)}</button>`,
        j: p => `{{ govukButton({ text: ${quote(p.text)} }) }}`
    },
    back: {
        n: 'Back link',
        g: 'Navigation',
        blk: 'beforeContent',
        m: ['govukBackLink', 'back-link'],
        p: [['text', 'Text', 'Back'], ['href', 'Link', 'javascript:history.back()']],
        h: p => `<a href="${escapeHtml(p.href)}" class="govuk-back-link">${escapeHtml(p.text)}</a>`,
        j: p => `{{ govukBackLink({ text: ${quote(p.text)}, href: ${quote(p.href)} }) }}`
    },
    accordion: {
        n: 'Accordion',
        g: 'Content',
        m: ['govukAccordion', 'accordion'],
        p: [['items', 'Sections (heading | content)', 'Documents | List the documents you need.\nPayment | Pay online by card.', 'area']],
        h: p => `<div class="govuk-accordion" data-module="govuk-accordion" id="accordion-1">${splitPairs(p.items).map(([a, b], i) => `<div class="govuk-accordion__section"><div class="govuk-accordion__section-header"><h2 class="govuk-accordion__section-heading"><span class="govuk-accordion__section-button" id="accordion-1-heading-${i + 1}">${escapeHtml(a)}</span></h2></div><div id="accordion-1-content-${i + 1}" class="govuk-accordion__section-content"><p class="govuk-body">${escapeHtml(b)}</p></div></div>`).join('')}</div>`,
        j: p => `{{ govukAccordion({\n  id: "accordion-1",\n  items: [\n${splitPairs(p.items).map(([a, b]) => `    {\n      heading: { text: ${quote(a)} },\n      content: { text: ${quote(b)} }\n    }`).join(',\n')}\n  ]\n}) }}`
    },
    panel: {
        n: 'Panel',
        g: 'Content',
        m: ['govukPanel', 'panel'],
        p: [['title', 'Title', 'Application complete'], ['text', 'Body', 'Your reference number<br><strong>HDJ2123F</strong>', 'area']],
        h: p => `<div class="govuk-panel govuk-panel--confirmation"><h1 class="govuk-panel__title">${escapeHtml(p.title)}</h1><div class="govuk-panel__body">${p.text}</div></div>`,
        j: p => `{{ govukPanel({\n  titleText: ${quote(p.title)},\n  html: ${quote(p.text)}\n}) }}`
    },
    summary: {
        n: 'Summary list',
        g: 'Content',
        m: ['govukSummaryList', 'summary-list'],
        p: [['rows', 'Rows (key | value)', 'Name | Sarah Philips\nDate of birth | 5 January 1978', 'area']],
        h: p => `<dl class="govuk-summary-list">${splitPairs(p.rows).map(([a, b]) => `<div class="govuk-summary-list__row"><dt class="govuk-summary-list__key">${escapeHtml(a)}</dt><dd class="govuk-summary-list__value">${escapeHtml(b)}</dd></div>`).join('')}</dl>`,
        j: p => `{{ govukSummaryList({\n  rows: [\n${splitPairs(p.rows).map(([a, b]) => `    {\n      key: { text: ${quote(a)} },\n      value: { text: ${quote(b)} }\n    }`).join(',\n')}\n  ]\n}) }}`
    },
    table: {
        n: 'Table',
        g: 'Content',
        m: ['govukTable', 'table'],
        p: [['caption', 'Caption', 'Dates and amounts'], ['rows', 'Rows (first line is the header)', 'Date | Amount\n First 6 weeks | £109.80\nNext 33 weeks | £109.80', 'area']],
        h: p => { const r = splitPairs(p.rows).map(([a, b]) => [a, ...(b ? b.split('|').map(s => s.trim()) : [])]); const hd = r.shift() || []; return `<table class="govuk-table"><caption class="govuk-table__caption govuk-table__caption--m">${escapeHtml(p.caption)}</caption><thead class="govuk-table__head"><tr class="govuk-table__row">${hd.map(c => `<th scope="col" class="govuk-table__header">${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody class="govuk-table__body">${r.map(x => `<tr class="govuk-table__row">${x.map(c => `<td class="govuk-table__cell">${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`; },
        j: p => { const r = splitPairs(p.rows).map(([a, b]) => [a, ...(b ? b.split('|').map(s => s.trim()) : [])]); const hd = r.shift() || []; return `{{ govukTable({\n  caption: ${quote(p.caption)},\n  captionClasses: "govuk-table__caption--m",\n  head: [${hd.map(c => `{ text: ${quote(c)} }`).join(', ')}],\n  rows: [\n${r.map(x => `    [${x.map(c => `{ text: ${quote(c)} }`).join(', ')}]`).join(',\n')}\n  ]\n}) }}`; }
    },
    tabs: {
        n: 'Tabs',
        g: 'Content',
        m: ['govukTabs', 'tabs'],
        p: [['items', 'Tabs (title | content)', 'Past day | Content for the past day.\nPast week | Content for the past week.', 'area']],
        h: p => `<div class="govuk-tabs" data-module="govuk-tabs"><h2 class="govuk-tabs__title">Contents</h2><ul class="govuk-tabs__list">${splitPairs(p.items).map(([a], i) => `<li class="govuk-tabs__list-item${i ? '' : ' govuk-tabs__list-item--selected'}"><a class="govuk-tabs__tab" href="#tab-${i + 1}">${escapeHtml(a)}</a></li>`).join('')}</ul>${splitPairs(p.items).map(([, b], i) => `<div class="govuk-tabs__panel${i ? ' govuk-tabs__panel--hidden' : ''}" id="tab-${i + 1}"><p class="govuk-body">${escapeHtml(b)}</p></div>`).join('')}</div>`,
        j: p => `{{ govukTabs({\n  items: [\n${splitPairs(p.items).map(([a, b], i) => `    {\n      label: ${quote(a)},\n      id: "tab-${i + 1}",\n      panel: { text: ${quote(b)} }\n    }`).join(',\n')}\n  ]\n}) }}`
    },
    tasks: {
        n: 'Task list',
        g: 'Content',
        m: ['govukTaskList', 'task-list'],
        p: [['items', 'Tasks (name | status)', 'Check eligibility | Completed\nAdd details | Not started', 'area']],
        h: p => `<ul class="govuk-task-list">${splitPairs(p.items).map(([a, b]) => `<li class="govuk-task-list__item govuk-task-list__item--with-link"><div class="govuk-task-list__name-and-hint"><a class="govuk-link govuk-task-list__link" href="#">${escapeHtml(a)}</a></div><div class="govuk-task-list__status">${/^completed$/i.test(b) ? escapeHtml(b) : `<strong class="govuk-tag govuk-tag--blue">${escapeHtml(b)}</strong>`}</div></li>`).join('')}</ul>`,
        j: p => `{{ govukTaskList({\n  idPrefix: "task-list",\n  items: [\n${splitPairs(p.items).map(([a, b]) => `    {\n      title: { text: ${quote(a)} },\n      href: "#",\n      status: ${/^completed$/i.test(b) ? `{ text: ${quote(b)} }` : `{ tag: { text: ${quote(b)}, classes: "govuk-tag--blue" } }`}\n    }`).join(',\n')}\n  ]\n}) }}`
    },
    date: {
        n: 'Date input',
        g: 'Form',
        f: 1,
        m: ['govukDateInput', 'date-input'],
        p: [['legend', 'Question', 'What is your date of birth?'], ['name', 'Name', 'dob'], ['hint', 'Hint', 'For example, 27 3 2007']],
        h: p => `<div class="govuk-form-group"><fieldset class="govuk-fieldset" role="group"><legend class="govuk-fieldset__legend govuk-fieldset__legend--m">${escapeHtml(p.legend)}</legend>${hintHtml(p.hint, p.name)}<div class="govuk-date-input" id="${p.name}">${[['Day', 2], ['Month', 2], ['Year', 4]].map(([l, w]) => `<div class="govuk-date-input__item"><div class="govuk-form-group"><label class="govuk-label govuk-date-input__label" for="${p.name}-${l.toLowerCase()}">${l}</label><input class="govuk-input govuk-date-input__input govuk-input--width-${w}" id="${p.name}-${l.toLowerCase()}" name="${p.name}-${l.toLowerCase()}" type="text" inputmode="numeric"></div></div>`).join('')}</div></fieldset></div>`,
        j: p => `{{ govukDateInput({\n  id: ${quote(p.name)},\n  namePrefix: ${quote(p.name)},\n  fieldset: { legend: { text: ${quote(p.legend)}, classes: "govuk-fieldset__legend--m" } }${p.hint ? `,\n  hint: { text: ${quote(p.hint)} }` : ''}\n}) }}`
    },
    count: {
        n: 'Character count',
        g: 'Form',
        f: 1,
        m: ['govukCharacterCount', 'character-count'],
        p: [['label', 'Label', 'Can you provide more detail?'], ['name', 'Name', 'more-detail'], ['limit', 'Character limit', '150']],
        h: p => `<div class="govuk-form-group govuk-character-count" data-module="govuk-character-count" data-maxlength="${escapeHtml(p.limit)}">${labelHtml(p.label, p.name)}<textarea class="govuk-textarea govuk-js-character-count" id="${p.name}" name="${p.name}" rows="5"></textarea><div id="${p.name}-info" class="govuk-hint govuk-character-count__message">You can enter up to ${escapeHtml(p.limit)} characters</div></div>`,
        j: p => `{{ govukCharacterCount({\n  name: ${quote(p.name)},\n  id: ${quote(p.name)},\n  maxlength: ${+p.limit || 150},\n  label: { text: ${quote(p.label)}, classes: "govuk-label--s" }\n}) }}`
    },
    upload: {
        n: 'File upload',
        g: 'Form',
        f: 1,
        m: ['govukFileUpload', 'file-upload'],
        p: [['label', 'Label', 'Upload a file'], ['name', 'Name', 'file-upload']],
        h: p => formGroup(p.label, p.name, '', `<input class="govuk-file-upload" id="${p.name}" name="${p.name}" type="file">`),
        j: p => fieldMacro('govukFileUpload', p)
    },
    password: {
        n: 'Password input',
        g: 'Form',
        f: 1,
        m: ['govukPasswordInput', 'password-input'],
        p: [['label', 'Label', 'Password'], ['name', 'Name', 'password']],
        h: p => `<div class="govuk-form-group govuk-password-input" data-module="govuk-password-input">${labelHtml(p.label, p.name)}<div class="govuk-input__wrapper govuk-password-input__wrapper"><input class="govuk-input govuk-password-input__input govuk-js-password-input-input" id="${p.name}" name="${p.name}" type="password" spellcheck="false" autocomplete="current-password" autocapitalize="none"><button type="button" class="govuk-button govuk-button--secondary govuk-password-input__toggle govuk-js-password-input-toggle" data-module="govuk-button" aria-controls="${p.name}" aria-label="Show password" hidden>Show</button></div></div>`,
        j: p => fieldMacro('govukPasswordInput', p)
    },
    fieldset: {
        n: 'Fieldset',
        g: 'Form',
        m: ['govukFieldset', 'fieldset'],
        p: [['legend', 'Legend', 'What is your address?'], ['size', 'Size', 'm', ['m', 's']]],
        h: p => `<fieldset class="govuk-fieldset"><legend class="govuk-fieldset__legend govuk-fieldset__legend--${p.size}">${escapeHtml(p.legend)}</legend></fieldset>`,
        j: p => `{{ govukFieldset({\n  legend: { text: ${quote(p.legend)}, classes: "govuk-fieldset__legend--${p.size}" }\n}) }}`
    },
    errmsg: {
        n: 'Error message',
        g: 'Form',
        m: ['govukErrorMessage', 'error-message'],
        p: [['text', 'Text', 'Enter your full name']],
        h: p => `<p class="govuk-error-message"><span class="govuk-visually-hidden">Error:</span> ${escapeHtml(p.text)}</p>`,
        j: p => `{{ govukErrorMessage({ text: ${quote(p.text)} }) }}`
    },
    errsum: {
        n: 'Error summary',
        g: 'Form',
        m: ['govukErrorSummary', 'error-summary'],
        p: [['title', 'Title', 'There is a problem'], ['items', 'Errors (text | #field)', 'Enter your full name | #full-name\nEnter a valid email address | #email', 'area']],
        h: p => `<div class="govuk-error-summary" data-module="govuk-error-summary"><div role="alert"><h2 class="govuk-error-summary__title">${escapeHtml(p.title)}</h2><div class="govuk-error-summary__body"><ul class="govuk-list govuk-error-summary__list">${splitPairs(p.items).map(([a, b]) => `<li><a href="${escapeHtml(b)}">${escapeHtml(a)}</a></li>`).join('')}</ul></div></div></div>`,
        j: p => `{{ govukErrorSummary({\n  titleText: ${quote(p.title)},\n  errorList: [\n${splitPairs(p.items).map(([a, b]) => `    { text: ${quote(a)}, href: ${quote(b)} }`).join(',\n')}\n  ]\n}) }}`
    },
    breadcrumbs: {
        n: 'Breadcrumbs',
        g: 'Navigation',
        blk: 'beforeContent',
        m: ['govukBreadcrumbs', 'breadcrumbs'],
        p: [['items', 'Links (text | href)', 'Home | /\nPassports | /passports', 'area']],
        h: p => `<nav class="govuk-breadcrumbs" aria-label="Breadcrumb"><ol class="govuk-breadcrumbs__list">${splitPairs(p.items).map(([a, b]) => `<li class="govuk-breadcrumbs__list-item"><a class="govuk-breadcrumbs__link" href="${escapeHtml(b)}">${escapeHtml(a)}</a></li>`).join('')}</ol></nav>`,
        j: p => `{{ govukBreadcrumbs({\n  items: [\n${splitPairs(p.items).map(([a, b]) => `    { text: ${quote(a)}, href: ${quote(b)} }`).join(',\n')}\n  ]\n}) }}`
    },
    pagination: {
        n: 'Pagination',
        g: 'Navigation',
        m: ['govukPagination', 'pagination'],
        p: [['current', 'Current page', '2'], ['total', 'Total pages (max 10)', '5']],
        h: p => { const [n, c] = pageNumbers(p); return `<nav class="govuk-pagination" aria-label="Pagination">${c > 1 ? `<div class="govuk-pagination__prev"><a class="govuk-link govuk-pagination__link" href="#" rel="prev">Previous</a></div>` : ''}<ul class="govuk-pagination__list">${Array.from({ length: n }, (_, i) => `<li class="govuk-pagination__item${i + 1 === c ? ' govuk-pagination__item--current' : ''}"><a class="govuk-link govuk-pagination__link" href="#" aria-label="Page ${i + 1}"${i + 1 === c ? ' aria-current="page"' : ''}>${i + 1}</a></li>`).join('')}</ul>${c < n ? `<div class="govuk-pagination__next"><a class="govuk-link govuk-pagination__link" href="#" rel="next">Next</a></div>` : ''}</nav>`; },
        j: p => { const [n, c] = pageNumbers(p); return `{{ govukPagination({\n${c > 1 ? '  previous: { href: "#" },\n' : ''}${c < n ? '  next: { href: "#" },\n' : ''}  items: [\n${Array.from({ length: n }, (_, i) => `    { number: ${i + 1}, href: "#"${i + 1 === c ? ', current: true' : ''} }`).join(',\n')}\n  ]\n}) }}`; }
    },
    servicenav: {
        n: 'Service navigation',
        g: 'Navigation',
        blk: 'header',
        m: ['govukServiceNavigation', 'service-navigation'],
        p: [['name', 'Service name', 'Apply for a licence'], ['items', 'Links (text | href)', 'Home | /\nAccount | /account', 'area']],
        h: p => `<section aria-label="Service information" class="govuk-service-navigation" data-module="govuk-service-navigation"><div class="govuk-width-container"><div class="govuk-service-navigation__container"><span class="govuk-service-navigation__service-name"><a href="/" class="govuk-service-navigation__link">${escapeHtml(p.name)}</a></span><nav aria-label="Menu" class="govuk-service-navigation__wrapper"><ul class="govuk-service-navigation__list">${splitPairs(p.items).map(([a, b]) => `<li class="govuk-service-navigation__item"><a class="govuk-service-navigation__link" href="${escapeHtml(b)}">${escapeHtml(a)}</a></li>`).join('')}</ul></nav></div></div></section>`,
        j: p => `{{ govukServiceNavigation({\n  serviceName: ${quote(p.name)},\n  serviceUrl: "/",\n  navigation: [\n${splitPairs(p.items).map(([a, b]) => `    { text: ${quote(a)}, href: ${quote(b)} }`).join(',\n')}\n  ]\n}) }}`
    },
    skip: {
        n: 'Skip link',
        g: 'Navigation',
        blk: 'skipLink',
        m: ['govukSkipLink', 'skip-link'],
        p: [['text', 'Text', 'Skip to main content']],
        h: p => `<a href="#main-content" class="govuk-skip-link" data-module="govuk-skip-link">${escapeHtml(p.text)}</a>`,
        j: p => `{{ govukSkipLink({ href: "#main-content", text: ${quote(p.text)} }) }}`
    },
    exit: {
        n: 'Exit this page',
        g: 'Navigation',
        blk: 'bodyStart',
        m: ['govukExitThisPage', 'exit-this-page'],
        p: [['text', 'Text', 'Exit this page']],
        h: p => `<div class="govuk-exit-this-page" data-module="govuk-exit-this-page"><a href="https://www.bbc.co.uk/weather" role="button" draggable="false" class="govuk-button govuk-button--warning govuk-exit-this-page__button govuk-js-exit-this-page-button" data-module="govuk-button"><span class="govuk-visually-hidden">Emergency</span> ${escapeHtml(p.text)}</a></div>`,
        j: p => `{{ govukExitThisPage({ text: ${quote(p.text)} }) }}`
    },
    header: {
        n: 'Header',
        g: 'Page layout',
        blk: 'header',
        m: ['govukHeader', 'header'],
        p: [['href', 'Logo link', '/']],
        h: p => `<header class="govuk-header" data-module="govuk-header"><div class="govuk-header__container govuk-width-container"><div class="govuk-header__logo"><a href="${escapeHtml(p.href)}" class="govuk-header__link govuk-header__link--homepage"><span class="govuk-header__logotype-text">GOV.UK</span></a></div></div></header>`,
        j: p => `{{ govukHeader({ homepageUrl: ${quote(p.href)} }) }}`
    },
    footer: {
        n: 'Footer',
        g: 'Page layout',
        blk: 'footer',
        m: ['govukFooter', 'footer'],
        p: [['items', 'Links (text | href)', 'Help | /help\nPrivacy | /privacy\nCookies | /cookies\nAccessibility statement | /accessibility', 'area']],
        h: p => `<footer class="govuk-footer"><div class="govuk-width-container"><div class="govuk-footer__meta"><div class="govuk-footer__meta-item govuk-footer__meta-item--grow"><h2 class="govuk-visually-hidden">Support links</h2><ul class="govuk-footer__inline-list">${splitPairs(p.items).map(([a, b]) => `<li class="govuk-footer__inline-list-item"><a class="govuk-footer__link" href="${escapeHtml(b)}">${escapeHtml(a)}</a></li>`).join('')}</ul></div></div></div></footer>`,
        j: p => `{{ govukFooter({\n  meta: {\n    items: [\n${splitPairs(p.items).map(([a, b]) => `      { href: ${quote(b)}, text: ${quote(a)} }`).join(',\n')}\n    ]\n  }\n}) }}`
    },
    phase: {
        n: 'Phase banner',
        g: 'Page layout',
        blk: 'beforeContent',
        m: ['govukPhaseBanner', 'phase-banner'],
        p: [['tag', 'Tag', 'Beta'], ['text', 'Text', 'This is a new service. Help us improve it.']],
        h: p => `<div class="govuk-phase-banner"><p class="govuk-phase-banner__content"><strong class="govuk-tag govuk-phase-banner__content__tag">${escapeHtml(p.tag)}</strong><span class="govuk-phase-banner__text">${escapeHtml(p.text)}</span></p></div>`,
        j: p => `{{ govukPhaseBanner({\n  tag: { text: ${quote(p.tag)} },\n  text: ${quote(p.text)}\n}) }}`
    },
    cookie: {
        n: 'Cookie banner',
        g: 'Page layout',
        blk: 'bodyStart',
        m: ['govukCookieBanner', 'cookie-banner'],
        p: [['name', 'Service name', 'Apply for a licence']],
        h: p => `<div class="govuk-cookie-banner" data-nosnippet role="region" aria-label="Cookies on ${escapeHtml(p.name)}"><div class="govuk-cookie-banner__message govuk-width-container"><h2 class="govuk-cookie-banner__heading govuk-heading-m">Cookies on ${escapeHtml(p.name)}</h2><div class="govuk-cookie-banner__content"><p class="govuk-body">We use some essential cookies to make this service work.</p></div><div class="govuk-button-group"><button type="button" class="govuk-button" data-module="govuk-button" name="cookies" value="accept">Accept additional cookies</button><button type="button" class="govuk-button" data-module="govuk-button" name="cookies" value="reject">Reject additional cookies</button><a class="govuk-link" href="/cookies">View cookies</a></div></div></div>`,
        j: p => `{{ govukCookieBanner({\n  ariaLabel: ${quote('Cookies on ' + p.name)},\n  messages: [{\n    headingText: ${quote('Cookies on ' + p.name)},\n    text: "We use some essential cookies to make this service work.",\n    actions: [\n      { text: "Accept additional cookies", type: "button", name: "cookies", value: "accept" },\n      { text: "Reject additional cookies", type: "button", name: "cookies", value: "reject" },\n      { text: "View cookies", href: "/cookies" }\n    ]\n  }]\n}) }}`
    }
};

// ---------- App state and persistence ----------
let state = {
    items: [],
    sel: null,
    tab: 'p',
    title: 'Page title'
};
try {
    const s = JSON.parse(localStorage.getItem('govuk-builder') || 'null');
    if (s && Array.isArray(s.items))
        state = Object.assign(state, s, { tab: 'p' });
}
catch (_) { }
if (!state.pages || !state.pages.length) {
    state.pages = [{
            id: 'p1',
            name: 'start',
            title: state.title,
            items: state.items,
            next: '',
            branch: {}
        }];
    state.cur = 0;
}
state.cur = Math.min(state.cur || 0, state.pages.length - 1);
state.items = state.pages[state.cur].items;
state.title = state.pages[state.cur].title;

const $ = s => document.querySelector(s);

const saveState = () => { const P = state.pages[state.cur]; if (P) {
    P.items = state.items;
    P.title = state.title;
} try {
    localStorage.setItem('govuk-builder', JSON.stringify(state));
}
catch (_) { } };

const createItem = t => { const p = {}; COMPONENTS[t].p.forEach(([k, , d]) => p[k] = d); return { t, p }; };

// ---------- Rendering ----------
function renderPalette() {
    let h = '';
    for (const g of ['Content', 'Form', 'Navigation', 'Page layout'])
        for (const [id, c] of Object.entries(COMPONENTS).filter(([, c]) => c.g === g)) {
            if (!h.includes('<h2>' + g))
                h += `<h2>${g}</h2>`;
            h += `<div class="pal" draggable="true" tabindex="0" role="button" data-id="${id}"><span>${c.n}</span><a class="gl" href="${guidanceUrl(id)}" target="_blank" rel="noopener" draggable="false" title="Design System guidance for ${c.n}" aria-label="Design System guidance for ${c.n} (opens in new tab)">?</a></div>`;
        }
    $('#pal').innerHTML = `<p class="hint" style="margin-top:0">Drag onto the page, or press Enter on a component.</p>` + h;
}

function renderCanvas() { $('#page').innerHTML = state.items.length ? state.items.map((it, i) => `<div class="it${i === state.sel ? ' sel' : ''}" draggable="true" tabindex="0" data-i="${i}"><div class="pv">${COMPONENTS[it.t].h(it.p)}</div></div>`).join('') : '<div class="empty">Drag a component here to start your page</div>'; }

const indent = s => s.split('\n').map(l => l ? '    ' + l : l).join('\n');

const hasForm = its => its.some(i => COMPONENTS[i.t].f || i.t === 'button');

const isForm = () => hasForm(state.items);

const splitPairs = s => splitLines(s).map(x => { const [a, ...b] = x.split('|'); return [a.trim(), b.join('|').trim()]; });

const formGroup = (l, n, h, inner) => `<div class="govuk-form-group">${labelHtml(l, n)}${hintHtml(h, n)}${inner}</div>`;

const pageNumbers = p => { const n = Math.min(Math.max(+p.total || 1, 1), 10); return [n, Math.min(Math.max(+p.current || 1, 1), n)]; };

const BLOCK_ORDER = ['skipLink', 'bodyStart', 'header', 'beforeContent', 'content', 'footer'];

const blockOf = i => COMPONENTS[i.t].blk || 'content';

const nunjucksFor = i => `{# ${COMPONENTS[i.t].n}: ${guidanceUrl(i.t)} #}\n` + (COMPONENTS[i.t].j || COMPONENTS[i.t].h)(i.p);

// ---------- Code generators (Nunjucks, HTML and routes tabs) ----------
function generateNunjucks() {
    const m = [...new Set(state.items.filter(i => COMPONENTS[i.t].m).map(i => COMPONENTS[i.t].m.join('|')))];
    const imp = m.map(x => { const [a, b] = x.split('|'); return `{% from "govuk/components/${b}/macro.njk" import ${a} %}`; }).join('\n');
    let out = `{% extends "layouts/main.html" %}\n\n${imp ? imp + '\n\n' : ''}{% block pageTitle %}\n  ${state.title}\n{% endblock %}\n\n`;
    BLOCK_ORDER.forEach(b => {
        const l = state.items.filter(i => blockOf(i) === b);
        if (!l.length)
            return;
        const body = l.map(nunjucksFor).join('\n\n');
        if (b === 'content') {
            const inner = isForm() ? `<form method="post" novalidate>\n${indent(body)}\n</form>` : body;
            out += `{% block content %}\n<div class="govuk-grid-row">\n  <div class="govuk-grid-column-two-thirds">\n${indent(inner)}\n  </div>\n</div>\n{% endblock %}\n\n`;
        }
        else
            out += `{% block ${b} %}\n${indent(body)}\n{% endblock %}\n\n`;
    });
    return out.trimEnd() + '\n';
}

function generateHtml() {
    const g = b => state.items.filter(i => blockOf(i) === b).map(i => COMPONENTS[i.t].h(i.p)).join('\n\n');
    return BLOCK_ORDER.map(b => { const t = g(b); if (!t)
        return ''; if (b !== 'content')
        return t + '\n\n'; const inner = isForm() ? `<form method="post" novalidate>\n${indent(t)}\n</form>` : t; return `<div class="govuk-grid-row">\n  <div class="govuk-grid-column-two-thirds">\n${indent(inner)}\n  </div>\n</div>\n\n`; }).join('').trimEnd() + '\n';
}

const guidanceUrl = t => { const c = COMPONENTS[t]; return 'https://design-system.service.gov.uk/' + (c.m ? 'components/' + (c.m[1] === 'input' ? 'text-input' : c.m[1]) : 'styles/' + (t === 'heading' ? 'headings' : 'paragraphs')) + '/'; };

function renderSidebar() {
    document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.t === state.tab));
    const sb = $('#sb');
    if (state.tab === 'p')
        return renderProperties(sb);
    if (state.tab === 'x')
        return renderExport(sb);
    renderCode(sb);
}

function renderCode(sb) {
    const txt = state.tab === 'n' ? generateNunjucks() : state.tab === 'r' ? generateRoutes() : generateHtml();
    if (!sb.querySelector('#out')) {
        sb.innerHTML = `<label class="f" style="margin-top:0" for="out">${state.tab === 'n' ? 'Save as app/views/' + state.pages[state.cur].name + '.html' : state.tab === 'r' ? 'Add to app/routes.js' : 'Plain HTML for the page body'}</label><textarea id="out" readonly></textarea><div class="row"><button class="btn" id="cp">Copy to clipboard</button><span class="hint" id="cm" role="status"></span></div>`;
        $('#cp').onclick = async () => { const o = $('#out'); try {
            await navigator.clipboard.writeText(o.value);
            $('#cm').textContent = 'Copied';
        }
        catch (_) {
            o.select();
            try {
                document.execCommand('copy');
                $('#cm').textContent = 'Copied';
            }
            catch (__) {
                $('#cm').textContent = 'Select the text and copy it';
            }
        } };
    }
    $('#out').value = txt;
}

function renderProperties(sb) {
    const it = state.items[state.sel];
    let h = pageSettingsHtml();
    if (!it) {
        sb.innerHTML = h + `<p class="hint" style="margin-top:16px">Select a component on the page to edit its content.</p>`;
        $('#pt').oninput = ev => { state.title = ev.target.value; saveState(); };
        return;
    }
    h += `<h2 style="margin-top:20px">${COMPONENTS[it.t].n}</h2><p><a class="gdl" href="${guidanceUrl(it.t)}" target="_blank" rel="noopener">Read the ${COMPONENTS[it.t].n} guidance on the GOV.UK Design System (opens in new tab)</a></p>`;
    COMPONENTS[it.t].p.forEach(([k, l, , ty]) => { h += `<label class="f" for="p-${k}">${l}</label>` + (Array.isArray(ty) ? `<select class="fld" id="p-${k}" data-k="${k}">${ty.map(o => `<option${it.p[k] === o ? ' selected' : ''}>${o}</option>`).join('')}</select>` : ty === 'area' ? `<textarea class="fld" rows="4" id="p-${k}" data-k="${k}">${escapeHtml(it.p[k])}</textarea>` : `<input class="fld" id="p-${k}" data-k="${k}" value="${escapeHtml(it.p[k])}">`); });
    h += `<div class="row"><button class="btn s" data-a="up">Move up</button><button class="btn s" data-a="down">Move down</button><button class="btn s" data-a="dup">Duplicate</button><button class="btn d" data-a="del">Delete</button></div>`;
    sb.innerHTML = h;
    $('#pt').oninput = ev => { state.title = ev.target.value; saveState(); };
}

function renderAll() { renderCanvas(); renderSidebar(); renderPageBar(); renderFlow(); saveState(); }

// ---------- Editing and drag-and-drop ----------
function addComponent(id, at) { const it = createItem(id); const i = at == null ? state.items.length : at; state.items.splice(i, 0, it); state.sel = i; state.tab = 'p'; renderAll(); }

function dropIndexAt(y) { const els = [...document.querySelectorAll('.it')]; let n = 0; els.forEach(el => { const r = el.getBoundingClientRect(); if (y > r.top + r.height / 2)
    n++; }); return n; }

function clearDropIndicators() { document.querySelectorAll('.dropb').forEach(x => x.classList.remove('dropb')); $('#cv').classList.remove('drope'); }
document.addEventListener('dragstart', ev => {
    const p = ev.target.closest && ev.target.closest('.pal'), i = ev.target.closest && ev.target.closest('.it');
    if (p)
        ev.dataTransfer.setData('text/plain', 'new:' + p.dataset.id);
    else if (i)
        ev.dataTransfer.setData('text/plain', 'mv:' + i.dataset.i);
    ev.dataTransfer.effectAllowed = 'copyMove';
});

const canvasElement = $('#cv');
canvasElement.addEventListener('dragover', ev => { ev.preventDefault(); clearDropIndicators(); const n = dropIndexAt(ev.clientY), els = document.querySelectorAll('.it'); if (n < els.length)
    els[n].classList.add('dropb');
else
    canvasElement.classList.add('drope'); });
canvasElement.addEventListener('dragleave', ev => { if (!canvasElement.contains(ev.relatedTarget))
    clearDropIndicators(); });
canvasElement.addEventListener('drop', ev => {
    ev.preventDefault();
    const n = dropIndexAt(ev.clientY);
    clearDropIndicators();
    const d = ev.dataTransfer.getData('text/plain');
    if (d.startsWith('new:'))
        addComponent(d.slice(4), n);
    else if (d.startsWith('mv:')) {
        const f = +d.slice(3), [it] = state.items.splice(f, 1);
        const to = n > f ? n - 1 : n;
        state.items.splice(to, 0, it);
        state.sel = to;
        renderAll();
    }
});
document.addEventListener('dragend', clearDropIndicators);
document.addEventListener('click', ev => {
    if (ev.target.closest('a'))
        return;
    if (handlePageClick(ev))
        return;
    const p = ev.target.closest('.pal');
    if (p)
        return addComponent(p.dataset.id);
    const i = ev.target.closest('.it');
    if (i) {
        state.sel = +i.dataset.i;
        state.tab = 'p';
        return renderAll();
    }
    const t = ev.target.closest('.tab');
    if (t) {
        state.tab = t.dataset.t;
        $('#sb').innerHTML = '';
        return renderSidebar();
    }
    const a = ev.target.closest('[data-a]');
    if (a) {
        const s = state.sel, I = state.items;
        if (a.dataset.a === 'del') {
            I.splice(s, 1);
            state.sel = null;
        }
        if (a.dataset.a === 'dup') {
            I.splice(s + 1, 0, JSON.parse(JSON.stringify(I[s])));
            state.sel = s + 1;
        }
        if (a.dataset.a === 'up' && s > 0) {
            [I[s - 1], I[s]] = [I[s], I[s - 1]];
            state.sel = s - 1;
        }
        if (a.dataset.a === 'down' && s < I.length - 1) {
            [I[s + 1], I[s]] = [I[s], I[s + 1]];
            state.sel = s + 1;
        }
        renderAll();
    }
});
document.addEventListener('keydown', ev => { if (ev.key !== 'Enter' || ev.target.closest('a'))
    return; const p = ev.target.closest && ev.target.closest('.pal'); if (p)
    addComponent(p.dataset.id); const i = ev.target.closest && ev.target.closest('.it'); if (i) {
    state.sel = +i.dataset.i;
    state.tab = 'p';
    renderAll();
} });
document.addEventListener('input', ev => { const k = ev.target.dataset && ev.target.dataset.k; if (!k || state.sel == null)
    return; state.items[state.sel].p[k] = ev.target.value; renderCanvas(); saveState(); });

function renderPageBar() {
    const flow = state.view === 'flow';
    const toggle = [['page', 'Editor'], ['flow', 'Flow']].map(([v, label]) =>
        `<button class="pg seg${(flow ? 'flow' : 'page') === v ? ' on' : ''}" data-view="${v}">${label}</button>`).join('');
    const pageButtons = state.pages.map((p, i) =>
        `<button class="pg${i === state.cur ? ' on' : ''}" data-pi="${i}">${escapeHtml(p.name)}</button>`).join('');
    $('#bar').innerHTML = toggle + (flow
        ? '<button class="pg add" data-add="1">+ Add screen</button><button class="pg" data-tidy="1">Tidy up</button>'
        : pageButtons + '<button class="pg add" data-add="1">+ Add page</button>');
}

function goPage(i) { saveState(); state.cur = i; state.items = state.pages[i].items; state.title = state.pages[i].title; state.sel = null; $('#sb').innerHTML = ''; renderAll(); }

function addPage() { saveState(); const n = state.pages.length + 1; state.pages.push({
    id: 'p' + Date.now().toString(36),
    name: 'page-' + n,
    title: 'Page ' + n,
    items: [],
    next: '',
    branch: {}
}); state.tab = 'p'; goPage(state.pages.length - 1); }

function delPage() { if (state.pages.length < 2)
    return; const id = state.pages[state.cur].id; state.pages.splice(state.cur, 1); state.pages.forEach(p => { if (p.next === id)
    p.next = ''; for (const k in p.branch || {})
    if (p.branch[k] === id)
        delete p.branch[k]; }); state.cur = Math.max(0, state.cur - 1); state.items = state.pages[state.cur].items; state.title = state.pages[state.cur].title; state.sel = null; $('#sb').innerHTML = ''; renderAll(); }

function handlePageClick(ev) { if (ev.target.closest('[data-pi]')) {
    goPage(+ev.target.closest('[data-pi]').dataset.pi);
    return 1;
} if (ev.target.closest('[data-add]')) {
    addPage();
    return 1;
} if (ev.target.closest('[data-delpage]')) {
    delPage();
    return 1;
} }

function pageSettingsHtml() {
    const P = state.pages[state.cur];
    P.branch = P.branch || {};
    const opts = (v, f) => `<option value="">${f}</option>` + state.pages.filter(x => x !== P).map(x => `<option value="${x.id}"${v === x.id ? ' selected' : ''}>/${escapeHtml(x.name)}</option>`).join('');
    let h = `<h2>Page settings</h2><label class="f" for="pt">Page title</label><input class="fld" id="pt" value="${escapeHtml(state.title)}"><label class="f" for="pn">Page name (route and file name)</label><input class="fld" data-pg="name" id="pn" value="${escapeHtml(P.name)}"><label class="f" for="nx">After the form is submitted, go to</label><select class="fld" data-pg="next" id="nx">${opts(P.next, 'Stay on this page')}</select>`;
    let n = 0;
    state.items.filter(i => i.t === 'radios').forEach(r => splitLines(r.p.options).forEach(o => { const k = r.p.name + '=' + slugify(o); h += `<label class="f" for="br${++n}">${escapeHtml(r.p.legend)}: if answer is ${escapeHtml(o)}, go to</label><select class="fld" data-pg="br:${escapeHtml(k)}" id="br${n}">${opts(P.branch[k], 'Use the default above')}</select>`; }));
    return h + `<div class="row"><button class="btn s" data-delpage="1"${state.pages.length < 2 ? ' disabled' : ''}>Delete this page</button></div><hr style="border:0;border-top:1px solid var(--ln);margin:16px 0">`;
}

function generateRoutes() {
    const nm = id => { const x = state.pages.find(p => p.id === id); return x && x.name; };
    let o = `// Pages without forms need no route: the kit serves app/views/<name>.html automatically.\nconst govukPrototypeKit = require('govuk-prototype-kit')\nconst router = govukPrototypeKit.requests.setupRouter()\n`, n = 0;
    state.pages.forEach(P => {
        if (!hasForm(P.items))
            return;
        n++;
        const br = P.branch || {}, rules = [];
        P.items.filter(i => i.t === 'radios').forEach(r => splitLines(r.p.options).forEach(x => { const t = nm(br[r.p.name + '=' + slugify(x)]); if (t)
            rules.push(`  if (req.session.data[${quote(r.p.name)}] === ${quote(slugify(x))}) {\n    return res.redirect('/${t}')\n  }\n`); }));
        o += `\n// ${P.title}\nrouter.post('/${P.name}', function (req, res) {\n${rules.join('')}  res.redirect('/${nm(P.next) || P.name}')\n})\n`;
    });
    if (!n)
        o += `\n// Add a button or form field to a page to generate its POST route.\n`;
    return o;
}
document.addEventListener('input', ev => {
    const k = ev.target.dataset && ev.target.dataset.pg;
    if (!k)
        return;
    const P = state.pages[state.cur];
    if (k === 'name')
        P.name = slugify(ev.target.value) || 'page';
    else if (k === 'next')
        P.next = ev.target.value;
    else if (k.startsWith('br:')) {
        P.branch = P.branch || {};
        P.branch[k.slice(3)] = ev.target.value;
    }
    saveState();
    renderPageBar();
    renderFlow();
});
renderPalette();
renderAll();
