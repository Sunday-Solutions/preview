# Sunday Solutions

Buildless HTML, CSS and JavaScript. Deployable assets live in `dist/`. Site identity is in `.openai/hosting.json`.

## Behaviour

- Responsive desktop, tablet and mobile layouts with collapsible mobile navigation.
- Service links preselect the enquiry category.
- Enquiry form validates required fields, prepares an encoded mailto draft, and offers a clipboard fallback. It does not submit or store leads. No email is sent automatically.
- Native accessible FAQ disclosures and a dismissible privacy dialog.
- Locally hosted fonts and image; no analytics or external runtime dependencies.

## Business details

The contact email `hello@sundaysolutions.com.au`, 6+ years experience, 24-hour quotes, seven-day service and $50 care plan come from the supplied brief. The email has not been verified. No fabricated phone number, ABN, customer testimonial, or savings statistics are included. Before broader release, confirm contact details and the precise service/maintenance terms. Add the real phone number and team photos when supplied.

## Assets

- Custom code-native hammer-and-sun identity: `dist/assets/logo-mark.svg`.
- Hero photo: `dist/assets/workday.webp`, generated with the built-in image tool. Illustrative workshop desk, not a real customer, employee or delivered project.
- Hero brief: natural editorial photograph of a sunlit small Australian workshop office; worn timber desk, silver laptop with a simple green and cream invoicing screen, notepad, yellow mug, tape measure, boxes and plants; warm afternoon light, no people or branding.
- DM Sans downloaded from Google Fonts; bundled licence in `dist/assets/FONT-LICENSE.txt`.

## Logo explorer

`dist/logos/` (live at `/logos/`) holds the logo concepts as SVG (`svg/current/` for the active direction: symbol, colour tile and lockup per concept; `svg/archive/` for earlier rounds) and a viewer page: click the logo or use the arrow keys to cycle, switch colour/one-colour, background, and preview the wordmark in matching fonts. Page is `noindex`.

**Preview on the real site:** the explorer's *See it on the site* button opens `/?logo=<id>&font=<font>`. `dist/brand.js` swaps the header, promise-board and footer marks plus the favicon, shows a small picker (cycle logos, change wordmark font) and remembers the choice in that browser. Ordinary visitors see the default logo; `/?logo=original` resets.

## Validation

JavaScript syntax, referenced assets, unique element IDs and section anchors checked. Browser checks covered desktop, 390px mobile and 768px tablet views, service-category preselection, enquiry draft generation, FAQ expansion, privacy dialog and mobile navigation.
