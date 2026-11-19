# V2 fidelity notes (from Figma get_design_context, page "V2 - B2B - Desktop", file Tv3pIozzzX3xMX2Whcb0Z0)

Global
- Font Inter. Primary #1E84EB, disabled primary #8FC2F4, text primary #232F46, dark #111928, secondary text #8899A8, stroke #DFE4EA, input border #E8EEF7, card border #EFF1F8, shades #D6DEEF / #BDC8E4, yellow #FFCB27.
- Button: bg #1E84EB, radius 15, padding 13/28, Inter Medium 16/24 white. Disabled bg #8FC2F4.
- Input: label Inter Medium 12/20 #232F46, gap 10; field white, border 1px #E8EEF7, radius 15, padding 12 16 12 20, text Regular 16/24 #232F46 (address 14/22). Height block 80.
- Select field border #DFE4EA, pl 12, 28px token icon, chevron 16.
- Checkbox: 20px, radius 4, checked bg #1E84EB + white check (9x6 at 6,7); unchecked white border #DFE4EA; disabled bg #E8EEF7 border #D6DEEF text #D6DEEF; label Regular 16/24 #111928, gap 10.
- Legal checkboxes: text 10/16 #8899A8 with "ONCHAIN®" Bold Italic.
- Footer: links 10px #8899A8 "Terms of Service" "Privacy Policy" (dashboard: "Terms and Conditions"), padding 10 inside px32 py10, gap 40; chat bubble 48px at right with p20. Footer top at 722 in 810 frames.
- Header (auth pages): h94, px56, logo 178x26 (ONCHAIN wordmark 100x16.5 at y4.7, RAMP pill #1E84EB 60x26 radius6 at x107, BETA tab white border .5 #1E84EB 28x26 at x150).

Sign in (50464) 1440x810
- Left hero: x149, vertically centred, w429, gap 28: "Sell Direct." #1E84EB / "Instantly." #232F46 Bold 60/72; sub 16/24 "The way buying digital assets should have always been." + Medium "No Middlemen—straight from the source."
- Right card: white, radius 50, x699 y127, p100, (to page right edge visually), left soft shadow (blurred #BDC8E4 30% bar 34x481 blur 25 at x691).
  - Title Medium 30/38 "Start your 14‑day **free trial**." w446, gap 32, gradient divider 446x16, "Sign in" SemiBold 24/30, email input with envelope 16 icon, Continue button full width. inner padding px26 pb24 gap16.
Email code (50817): card 646x556 centered content w446: envelope 32 blue; text 16 "We’ve just sent an email to **youremail@yourdomain.com**\nPlease check your email and enter the confirmation code bellow."; 6 boxes 40x48 radius6 border #E2E3F0 gap10 with "-" after 3 (SemiBold 18); "Didn’t get an email?" 14/22 + "Resend code" Medium #1E84EB; Continue disabled until filled.
Details cards (50533/50614): centered card w472, border #EFF1F8, radius16, p32, gap32; title SemiBold 16/24 centered; fields gap16.
- Personal Details: Full name / Company name / Digital asset website.
- Digital asset details: Network select (Ethereum), Address, Tax (+info 12) row: Buy tax / Sell tax / N/A (gap16; N/A checked disables others); Complete sign up; legal checkboxes x3 (gap 8).
Unsupported modal (50764): overlay rgba(243,245,250,.7); modal white radius30 w472 p16; inner py16 px19 gap8: warning 32 (#FFCB27) in p8; title SemiBold 24/30; body Regular 18/26; checkbox "Please notify me when this feature is supported"; Close button full width.

Dashboard shell (setup screens 53271/54115) 1440x870
- Top bar: h81, white, border-b #E8EEF7, px72 py18. Left: ACME logo 39 + "ACME Protocol" SemiBold 18/26 gap16. Right gap21: [gap32: "Renews in:" 10/16 #8899A8 + "12 days" Bold 12/20; Ramp link button (disabled during setup: bg #F3F5FA border same, text Medium 14/22 #D6DEEF + copy 16) h36 px16 radius15 gap4; name Medium 16/24 + role 14/22 #8899A8] avatar 42 #1E84EB "TG" SemiBold16 white; chevron-down 16 in 30 box.
- Body px52 py24; panel = left sidebar bg #FAFAFA radius 20 0 0 20 p16 gap16 (w402 inner 370) + right panel bg rgba(250,250,250,.7) border-l #E8EEF7 radius 0 20 20 0 p16 flex 1.
- Finish setup header: "Finish setup" Bold 18/26 #1E84EB p8; close 16 #8899A8. Progress: track #DFE4EA h~12 radius full, fill #1E84EB, label "40%" Medium 12/20 white inside fill. Gap 24 then list gap 8.
- Step row min-h48 px16 py4 radius15 gap8; icon 20 + text Regular 16/24; chevron-right 16. Done: bg rgba(177,221,188,.2), text+icons #1A9338. Current: bg #F3F4F6. Todo: transparent, #232F46, circle #8899A8.
- Right panel content: title SemiBold 24/30 p8; subtitle 14/22 #8899A8 px8 w368; sections gap24; field column w420 px8.
- Footer dashboard: px52 py10 "Terms and Conditions" "Privacy Policy" 10px #8899A8, chat 48.
Payment details: default currency disabled field (bg #F3F5FA border #E8EEF7 text #CED8E9 "ACME"); "Secondary payment currency" 12/20; USDC 24 icon + "USDC"; network select white border #E8EEF7 "Select network " #8899A8 + chevron; info card w458 pt29 px16: white border #E8EEF7 radius20 px30 py24 shadow 0 39 23 -27 rgba(0,0,0,.04): 14/22 Bold "Pay with your digital asset" + text + underlined link "Read more about this" + ⚠ (#FFCC00) Bold warning.
Plan: 3 cards gap14 h486 p30 radius20 border #DFE4EA shadow same; inner w213. Starter: name SemiBold 18/26 #1E84EB; $200 Bold 40/48 + "/ month" 14/22 #8899A8; desc 16/24 #8899A8; divider; features 14/22 #8899A8 with check-blue 16 gap8 list gap4; "Choose Starter" button h50 radius15. Insights/Enterprise all #D6DEEF, "Coming soon" bg #F3F5FA text #D6DEEF; Enterprise "On Request" Bold 30/38.
Verification: X Sign in button outline #1E84EB h48 radius15 (X logo 24x20 + "Sign in" Medium16 #232F46); divider line; "Credentials" 18/26; checkbox "Email the X account owner" 14/22 #8899A8; input "Owners email address" label 12/20, field bg #F3F5FA (disabled until checkbox) placeholder "Enter owners email address" + envelope gray; "Send email" disabled bg #F3F5FA text #D6DEEF h48.
Not cleared: title + badge (bg rgba(253,63,54,.3) radius6 px8 py2 w86, cross-circle 12 + "Not cleared" Medium 10/16 #A31B15); "Your digital asset hasn’t cleared." Bold 14; text 14 #8899A8; issues with warning 12 yellow + Bold 14; "Talk to support" primary h48 w404; bottom "Powered by GoPlus Security" 12/20 #8899A8 + GoPlus logo 68x14.
Whitepaper: label "Your whitepaper link" 12/20 #8899A8; field white border #E8EEF7 placeholder "Enter your whitepaper link".
Setting up modal: white radius24 py32 w472 shadow 0 3 8 rgba(0,0,0,.12),0 3 1 rgba(0,0,0,.04); loader 163 gradient ring (assets loader-ring.png) around 80 circle border #BDC8E4 with C logo 53; gap40; "Setting up your account" SemiBold 24/30; "You’re almost there, it will just take a moment..." Medium 16/24.

Dashboard cards (55479 transactions / 55811 digital asset)
- Card bg rgba(250,250,250,.7) radius20 p16 gap24. Title "Transactions"/"Digital asset" Regular 16/24 #1E84EB p8 (in px8).
- Table px16: header 10/16 Medium #8899A8 cols flex-1: Amount(sort 12) Status Quantity Wallet Date(sort) | On-chain tx w196.8 | Order ID w91. Divider 8px. Rows h36: "$300" Medium 12/20 w37 + "USD" Regular 12 w30 gap8; badge; text Regular 12/20 #232F46; copy 12 #8899A8 gap8; row separator 16px with 1px line #F3F5FA.
- Badges radius6 px8 py2 Medium 10/16, icon 12 gap4: Succeeded bg rgba(52,199,89,.5) text #145B43; Pending bg #FFCC00 text #574500 w86; Failed bg rgba(253,63,54,.3) text #A31B15 w86.
- "View all transactions" small button h50 px12 radius15 Medium 14/22 (disabled bg #F3F5FA #D6DEEF; active probably white border).
- Digital asset: Ticker(12 SemiBold #8899A8 + info) ACME 32 + "ACME" SemiBold 18/26; Status dot 28 (#34C759 with #E8EEF7 ring); Address Medium 16/24 + copy16; Description 12 SemiBold label + 14/22 text; left block w620; Available pairs table: DEX (uni 32 + "Uniswap V4" 12), Pair, Network (eth 32 circle), Volume (24h) sort, Cleared w100 dot.
Payment failed banner: bg #FF3B30 h40, white 14/22 with bold parts, "Retry Payment" outline white h28 px8 radius15 Medium 12/20.
Payment failed modal: white radius30 w472 p16; inner px19 py16 gap8: error icon 32 red in p8; "Payment Failed" SemiBold24/30; "We couldn’t complete your payment." 18/26; "Please try again or contact support if the issue continues." 18/26; "Try again" primary; "Cancel" text button Medium 14/22 #232F46 pt8 pb4.

Settings (50985 left / 51907 billing payment details)
- Left sidebar same as Finish setup: "Settings" Bold18 #1E84EB + close; list w370 gap8: Project info / Digital asset / Billing / Deactivate account — rows min-h48 px16 radius15, active bg #F3F4F6, text 16/24 #232F46, chevron-right #8899A8.
- Right panel title "Billing" SemiBold24 p8; tabs gap16: text buttons h48 py8 px9 SemiBold 18/26, inactive #8899A8, active #232F46 with 1px underline (#232F46) gap6; full-width 1px line under tabs (#E8EEF7) at y40.
- Payment details (2 cols gap24, px8): left: "Payment details" SemiBold18; disabled ACME field; row: "Secondary payment method" (USDC) | "USDC network" select h50 (eth 24 + "Ethereum" + chevron); right: info card. Divider 16. Balance block: "Balance" SemiBold18; "$1200" Bold40/48 + status dot 28; "Next payment due **29th April**" 12/20 #8899A8. "Billing details": input label "Deposit and drawdown address", field bg #F3F5FA "0x8954...9F12A4" #8899A8 + copy16.
Project info: "Project info" title; divider; row: Logo (upload circle 48 bg #F3F5FA with image icon 30) + Company name (ACME Labs); row: Full name | Email (disabled bg #F3F5FA text #8899A8 gustavo@onchainlabs.org).
Deactivate panel: 18/26 paragraphs x2 + red button bg #FD3F36 h50 px28 "Deactivate account".
Confirm modal: overlay rgba(243,245,250,.7); card w534 white border #EFF1F8 radius16 p32 gap32: title SemiBold24 center; subtitle 18/26 center "Are you sure you want to Deactivate your account?"; body 14/22 paragraphs; checkbox "I understand that suspending my account is temporary and my data will be saved." 16/24 #111928; red full button.
Done: "Your request to deactivate your account has been received 😔" SemiBold24; text 18/26; "Reactivate account" primary.
Survey: "Before you go, tell us why you are leaving" + radios (I no longer use the service / Privacy or security concerns / Too many emails or notifications / Technical issues or poor user experience / Found a better alternative / Other reason) + textarea "Tell us your reason" + red "Continue to deactivate account" + "Skip".
