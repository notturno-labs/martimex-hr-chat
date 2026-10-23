/*
  Zaglavlje i podnožje kao na martimex.hr (za probne stranice proba.html i
  kontakt.html). HTML je preuzet sa stranice martimex.hr (bez skripti,
  izbornika koji se otvaraju i prozora za prijavu), a stil dolazi izravno s
  martimex.hr, pa izgleda isto kao webshop.

  Upotreba: <script src="okvir.js" data-dio="zaglavlje" data-stranica="kontakt"></script>
            <script src="okvir.js" data-dio="podnozje"></script>
  Skripta umetne svoj dio točno na mjesto gdje stoji (dok se stranica čita).
*/
(function () {
  'use strict';
  var skripta = document.currentScript;
  if (!skripta) return;
  var dio = skripta.getAttribute('data-dio');
  var stranica = skripta.getAttribute('data-stranica') || '';
  var STR = 'https://martimex.hr/';
  var U = STR + 'martimex-content/uploads/';

  var SRCE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M17.4978 1.01001C16.3722 1.02752 15.2711 1.34173 14.3058 1.92091C13.3405 2.5001 12.5451 3.32375 12 4.30868C11.4549 3.32375 10.6595 2.5001 9.69417 1.92091C8.72886 1.34173 7.62781 1.02752 6.50222 1.01001C4.70788 1.08797 3.01733 1.87292 1.7999 3.19336C0.582466 4.51381 -0.0628841 6.26242 0.00483915 8.05717C0.00483915 14.8294 10.9564 22.6513 11.4222 22.9831L12 23.392L12.5778 22.9831C13.0436 22.6533 23.9952 14.8294 23.9952 8.05717C24.0629 6.26242 23.4175 4.51381 22.2001 3.19336C20.9827 1.87292 19.2921 1.08797 17.4978 1.01001ZM12 20.931C8.74831 18.502 2.00403 12.5344 2.00403 8.05717C1.9357 6.79239 2.37025 5.55191 3.21291 4.60626C4.05557 3.66061 5.23796 3.08652 6.50222 3.0092C7.76647 3.08652 8.94887 3.66061 9.79153 4.60626C10.6342 5.55191 11.0687 6.79239 11.0004 8.05717H12.9996C12.9313 6.79239 13.3658 5.55191 14.2085 4.60626C15.0511 3.66061 16.2335 3.08652 17.4978 3.0092C18.762 3.08652 19.9444 3.66061 20.7871 4.60626C21.6297 5.55191 22.0643 6.79239 21.996 8.05717C21.996 12.5364 15.2517 18.502 12 20.931Z" fill="currentColor"></path> </svg>';
  var KOSARICA = '<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 3.01001H4.242L4.2 2.65901C4.11405 1.92943 3.76338 1.25674 3.21449 0.768488C2.6656 0.280233 1.95663 0.0103516 1.222 0.0100098H0V2.01001H1.222C1.46693 2.01004 1.70334 2.09997 1.88637 2.26273C2.06941 2.42548 2.18634 2.64976 2.215 2.89301L3.8 16.361C3.88595 17.0906 4.23662 17.7633 4.78551 18.2515C5.3344 18.7398 6.04337 19.0097 6.778 19.01H20V17.01H6.778C6.53291 17.0099 6.29638 16.9199 6.11333 16.7569C5.93027 16.594 5.81343 16.3694 5.785 16.126L5.654 15.01H21.836L24 3.01001ZM20.164 13.01H5.419L4.478 5.01001H21.607L20.164 13.01ZM7.00002 24.0101C8.10459 24.0101 9.00002 23.1147 9.00002 22.0101C9.00002 20.9055 8.10459 20.0101 7.00002 20.0101C5.89545 20.0101 5.00002 20.9055 5.00002 22.0101C5.00002 23.1147 5.89545 24.0101 7.00002 24.0101ZM19 22.0101C19 23.1147 18.1046 24.0101 17 24.0101C15.8954 24.0101 15 23.1147 15 22.0101C15 20.9055 15.8954 20.0101 17 20.0101C18.1046 20.0101 19 20.9055 19 22.0101Z" fill="currentColor"></path> </svg>';
  var KORISNIK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M15.3334 10.9988C14.3467 11.6581 13.1867 12.01 12 12.01C10.4092 12.0084 8.88399 11.3758 7.75911 10.2509C6.63424 9.12603 6.00159 7.60082 6 6.01001C6 4.82332 6.35189 3.66329 7.01118 2.67659C7.67047 1.6899 8.60754 0.920861 9.7039 0.466735C10.8003 0.0126095 12.0067 -0.106211 13.1705 0.125301C14.3344 0.356812 15.4035 0.928257 16.2426 1.76737C17.0818 2.60649 17.6532 3.67558 17.8847 4.83947C18.1162 6.00336 17.9974 7.20976 17.5433 8.30611C17.0892 9.40247 16.3201 10.3395 15.3334 10.9988ZM14.2223 2.68413C13.5645 2.24461 12.7911 2.01001 12 2.01001C10.9391 2.01001 9.92172 2.43144 9.17157 3.18159C8.42143 3.93173 8 4.94915 8 6.01001C8 6.80114 8.2346 7.5745 8.67412 8.23229C9.11365 8.89009 9.73836 9.40278 10.4693 9.70553C11.2002 10.0083 12.0044 10.0875 12.7804 9.93315C13.5563 9.77881 14.269 9.39785 14.8284 8.83844C15.3878 8.27903 15.7688 7.5663 15.9231 6.79037C16.0775 6.01445 15.9983 5.21018 15.6955 4.47928C15.3928 3.74837 14.8801 3.12366 14.2223 2.68413ZM5.63896 16.649C7.32622 14.9617 9.61386 14.0127 12 14.01C14.3861 14.0127 16.6738 14.9617 18.361 16.649C20.0483 18.3362 20.9974 20.6239 21 23.01C21 23.2752 20.8946 23.5296 20.7071 23.7171C20.5196 23.9047 20.2652 24.01 20 24.01C19.7348 24.01 19.4804 23.9047 19.2929 23.7171C19.1054 23.5296 19 23.2752 19 23.01C19 21.1535 18.2625 19.373 16.9497 18.0603C15.637 16.7475 13.8565 16.01 12 16.01C10.1435 16.01 8.36301 16.7475 7.05025 18.0603C5.7375 19.373 5 21.1535 5 23.01C5 23.2752 4.89464 23.5296 4.70711 23.7171C4.51957 23.9047 4.26522 24.01 4 24.01C3.73478 24.01 3.48043 23.9047 3.29289 23.7171C3.10536 23.5296 3 23.2752 3 23.01C3.00265 20.6239 3.95171 18.3362 5.63896 16.649Z" fill="currentColor"></path> </svg>';
  var POVECALO = '<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" class="search-field__icon-left"> <path d="M24.7078 23.293L18.7388 17.324C20.3654 15.3346 21.1651 12.7961 20.9726 10.2336C20.7801 7.67106 19.61 5.28056 17.7043 3.55655C15.7987 1.83254 13.3034 0.906918 10.7344 0.97115C8.16545 1.03538 5.71946 2.08455 3.90237 3.90164C2.08528 5.71873 1.03611 8.16472 0.971883 10.7337C0.907651 13.3026 1.83327 15.798 3.55728 17.7036C5.28129 19.6092 7.67179 20.7793 10.2343 20.9719C12.7969 21.1644 15.3354 20.3647 17.3248 18.738L23.2938 24.707C23.4824 24.8892 23.735 24.99 23.9972 24.9877C24.2594 24.9854 24.5102 24.8803 24.6956 24.6948C24.881 24.5094 24.9862 24.2586 24.9884 23.9964C24.9907 23.7342 24.8899 23.4816 24.7078 23.293ZM11.0008 19C9.41851 19 7.87179 18.5308 6.5562 17.6518C5.2406 16.7727 4.21522 15.5233 3.60972 14.0615C3.00422 12.5997 2.84579 10.9912 3.15448 9.4393C3.46316 7.88746 4.22508 6.46199 5.3439 5.34317C6.46272 4.22435 7.88819 3.46243 9.44004 3.15374C10.9919 2.84506 12.6004 3.00349 14.0622 3.60899C15.524 4.21449 16.7735 5.23987 17.6525 6.55546C18.5316 7.87106 19.0008 9.41778 19.0008 11C18.9984 13.121 18.1548 15.1545 16.655 16.6543C15.1552 18.154 13.1218 18.9976 11.0008 19Z" fill="currentColor"></path> </svg>';
  var STRELICA = '<svg class="" width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M18 11.22L17 10.02L12 14.62L7 10.02L6 11.22L12 16.62L18 11.22Z" fill="#171717"></path> </svg>';

  function stavka(id, href, naziv, trenutna) {
    return '<li id="menu-item-' + id + '" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-' + id +
      (trenutna ? ' current-menu-item page_item current_page_item' : '') + '"><a href="' + href + '"' + (trenutna ? ' aria-current="page"' : '') +
      ' class="h5 t-600 btn btn--md btn--ghost' + (trenutna ? ' active' : '') + '">' + naziv + '</a></li>';
  }
  function kategorija(naziv, href, odabrana) {
    var oznaka = href ? 'a' : 'span';
    return ' <' + oznaka + ' class="btn ' + (odabrana ? 'btn--secondary' : 'btn--ghost') + ' btn--sm h5 t-600"' + (href ? ' href="' + href + '"' : '') +
      '> <span class="btn__label ">' + naziv + '</span> </' + oznaka + '>';
  }
  function najava(mobitel) {
    var a = [['2024/10/shipping-icon.svg', 'Besplatna dostava iznad 75€'], ['2024/10/gift-icon.svg', 'Poklon uz svaku kupnju iznad 10€']].map(function (n) {
      return ' <span class="announcements-bar__single-ann' + (mobitel ? ' swiper-slide' : '') + '"> <img referrerpolicy="no-referrer" src="' + U + n[0] + '" alt="' + n[1] + '"><h5>' + n[1] + '</h5> </span>';
    }).join('');
    return '<div class="announcements-bar' + (mobitel ? ' announcements-bar-mobile' : '') + '" style="background-color: #171717"><div class="announcements-bar__container">' +
      (mobitel ? '<div class="swiper-announcements-bar"><div class="swiper-wrapper">' + a + '</div></div>' : a) + '</div></div>';
  }

  var html = '';
  if (dio === 'zaglavlje') {
    html =
      '<div>' + najava(false) + najava(true) + '</div>' +
      '<header class="site-header"><div class="site-header__main-wrap"> <button class="btn btn--ghost site-header__mobile-menu-icon js-mobile-menu-open" type="button" aria-label="Izbornik"> <span></span> </button>' +
        '<nav class="site-header__nav-primary" aria-label="Main menu"><div class="menu-main-menu-container"><ul id="menu-main-menu" class="nav">' +
          stavka(20, STR + 'poslovnice/', 'Poslovnice') +
          stavka(26, 'kontakt.html', 'Kontakt', stranica === 'kontakt') +
          stavka(23, STR + 'o-nama/', 'O nama') +
          stavka(44492, STR + 'savjeti/', 'Beauty blog') +
        '</ul></div></nav>' +
        ' <a class="site-header__logo" href="proba.html"> <img referrerpolicy="no-referrer" src="' + U + '2024/10/martimex-logo.svg" alt="Martimex logo"> </a>' +
        '<nav class="site-header__nav-primary site-header__nav-primary-right" aria-label="Main menu right"><div class="menu-main-menu-right-container"><ul id="menu-main-menu-right" class="nav">' +
          stavka(35, STR + 'loyalty-program/', 'Loyalty program') +
          stavka(47395, STR + 'poklon-bon/', 'Poklon bon') +
        '</ul></div><div class="site-header__nav-icons">' +
          ' <a href="' + STR + 'wishlist/" class="site-header__nav-icon-button js-header-wishlist" aria-label="Lista želja"> ' + SRCE + ' </a>' +
          ' <button class="site-header__nav-icon-button js-open-cart js-open-cart-header" aria-label="Košarica"> ' + KOSARICA + ' </button>' +
          '<div class="site-header__auth-wrapper"> <button class="site-header__nav-icon-button js-toggle-auth-button" aria-label="Prijava"> ' + KORISNIK + ' </button></div>' +
        '</div></nav></div>' +
        '<div class="site-header__lower-wrap"><nav class="site-header__nav-lower" aria-label="Main menu (Menu lower left)"><div><ul id="menu-menu-lower-left" class="nav">' +
          '<li> <a class="btn btn--primary btn--md h5 t-600" href="' + STR + 'chanel/"> <img referrerpolicy="no-referrer" src="' + U + '2024/11/CHANEL_bijelo_100x24-2.svg" alt="CHANEL"> </a></li>' +
          '<li> <a class="btn btn--secondary btn--md h5 t-600" href="' + STR + 'beauty-saloni/"> <span class="btn__label ">Beauty saloni</span> </a></li>' +
        '</ul></div></nav>' +
        '<div class="site-header__mega-menu-titles-wrap js-mm-titles">' +
          '<div class="site-header__mega-menu-scroll site-header__mega-menu-scroll--left"><div class="js-scroll-mm-left" style="display: none;"> <button class="btn btn--secondary btn--icon" aria-label="Prethodne kategorije" type="button"> ' + STRELICA + ' </button></div></div>' +
          kategorija('Ponude i akcije', '', true) + kategorija('Novo', STR + 'novo') + kategorija('XMAS') + kategorija('K-BEAUTY', STR + 'oznaka/k-beauty/') +
          kategorija('Brandovi') + kategorija('Niche') + kategorija('Parfemi') + kategorija('Makeup') + kategorija('Njega') + kategorija('Kosa') +
          kategorija('Dodaci') + kategorija('OUTLET', STR + 'oznaka/outlet/') +
          '<div class="site-header__mega-menu-scroll site-header__mega-menu-scroll--right"><div class="js-scroll-mm-right" style="display: none;"> <button class="btn btn--secondary btn--icon" aria-label="Sljedeće kategorije" type="button"> ' + STRELICA + ' </button></div></div>' +
        '</div>' +
        '<div class="site-header__search"><div class="search-field"> ' + POVECALO + ' <input type="text" placeholder="Pretraži" class="search-field__input" aria-label="Pretraži"></div></div>' +
        '<div class="site-header__nav-lower-account-buttons"> <a href="' + STR + 'wishlist/" class="js-header-wishlist-mobile" aria-label="Lista želja"> ' + SRCE + ' </a>' +
          ' <span class="js-mobile-toggle-account-modal"> ' + KORISNIK + ' </span></div>' +
        '</div></header>';
  } else if (dio === 'podnozje') {
    var drustvene = function (mobitel) {
      return '<div class="site-footer__social' + (mobitel ? ' site-footer__social--mobile' : '') + '">' +
        ' <a href="https://www.instagram.com/martimex_parfumerije" target="_blank"> <img referrerpolicy="no-referrer" src="' + U + '2024/10/instagram-icon.svg" alt="Instagram icon"> </a>' +
        ' <a href="https://www.facebook.com/parfumerije.martimex/" target="_blank"> <img referrerpolicy="no-referrer" src="' + U + '2024/10/fb-icon.svg" alt="Facebook icon"> </a>' +
        ' <a href="mailto:webshop@martimex.hr" target="_blank"> <img referrerpolicy="no-referrer" src="' + U + '2024/10/email-icon.svg" alt="Mail icon"> </a></div>';
    };
    var poveznica = function (n) { return ' <a class="btn btn--ghost btn--sm" href="' + STR + n[1] + '/"> <span class="btn__label ">' + n[0] + '</span> </a>'; };
    html =
      '<footer class="site-footer"><div class="site-footer__container">' +
        '<div class="site-footer__logo-wrap"> <span class="site-footer__line"></span> <img referrerpolicy="no-referrer" src="' + U + '2024/10/martimex-logo.svg" alt="Martimex logo"> <span class="site-footer__line"></span></div>' +
        drustvene(true) +
        '<div class="site-footer__links-wrap"><div class="site-footer__links-inner">' +
          [['Najčešća pitanja', 'najcesca-pitanja'], ['Pravila privatnosti', 'pravila-privatnosti'], ['Opći uvjeti poslovanja', 'opci-uvjeti-poslovanja'], ['Martimex Loyalty Card', 'martimex-loyalty-card']].map(poveznica).join('') +
        '</div><div class="site-footer__links-inner site-footer__links-inner--right">' +
          [['Poslovnice', 'poslovnice'], ['Povrat i reklamacija', 'povrat-i-reklamacija'], ['Dostava i isporuka', 'dostava-i-isporuka'], ['Plaćanje robe', 'placanje-robe']].map(poveznica).join('') +
        '</div></div>' +
        '<div class="site-footer__bottom-wrap"><div class="site-footer__newsletter"><div class="site-footer__newsletter-inner"><h4 class="t-600">Newsletter</h4>' +
          '<h6>Ostvarite 10% popusta prilikom sljedeće kupnje i prvi otkrijte sve o najnovijim proizvodima, akcijskim i ekskluzivnim ponudama te posebnim događanjima.</h6></div>' +
          '<div><form class="newsletter-form" novalidate="" onsubmit="return false"><div class="site-footer__newsletter-apply"><div class="input-wrap"> <input type="email" name="email" class="input-field input-field--no-label" placeholder="Unesi email" aria-label="Email"></div>' +
          ' <button class="btn btn--primary" type="submit"> <span class="btn__label ">Prijava</span> </button></div></form></div></div>' +
          '<div class="site-footer__icons">' + drustvene(false) + '<div class="site-footer__card-icons">' +
            ['2025/03/Apple-pay.png', '2025/03/GPay_Acceptance_Mark_800_.png', '2024/11/credit-card-01.png', '2024/11/credit-card-04.png', '2024/11/credit-card-05.png', '2024/11/credit-card-03.png', '2024/11/credit-card-06.png']
              .map(function (s) { return ' <img referrerpolicy="no-referrer" src="' + U + s + '" alt="">'; }).join('') +
          '</div></div></div>' +
        ' <span class="h6 site-footer__copyright">©Martimex 2026</span></div></footer>';
  }
  if (!html) return;
  skripta.insertAdjacentHTML('beforebegin', html);

  // Kategorije: kad ne stanu u red, pojave se strelice za pomicanje (kao na martimex.hr)
  if (dio === 'zaglavlje') {
    var red = document.querySelector('.site-header__mega-menu-titles-wrap');
    var lijevo = red && red.querySelector('.js-scroll-mm-left');
    var desno = red && red.querySelector('.js-scroll-mm-right');
    if (!red || !lijevo || !desno) return;
    // kao na martimex.hr: kad kategorije ne stanu, red dobije klasu
    // "scrollable" (počinje prvom kategorijom, strelice su vidljive), a
    // strelica na kraju na koji se više ne može ići se sakrije
    var uskladi = function () {
      red.classList.remove('scrollable');
      var vise = red.scrollWidth - red.clientWidth > 2;
      red.classList.toggle('scrollable', vise);
      lijevo.style.display = vise && red.scrollLeft > 2 ? '' : 'none';
      desno.style.display = !vise || red.scrollLeft >= red.scrollWidth - red.clientWidth - 2 ? 'none' : '';
    };
    red.addEventListener('scroll', function () {
      lijevo.style.display = red.scrollLeft > 2 ? '' : 'none';
      desno.style.display = red.scrollLeft >= red.scrollWidth - red.clientWidth - 2 ? 'none' : '';
    }, { passive: true });
    lijevo.addEventListener('click', function () { red.scrollBy({ left: -240, behavior: 'smooth' }); });
    desno.addEventListener('click', function () { red.scrollBy({ left: 240, behavior: 'smooth' }); });
    window.addEventListener('resize', uskladi);
    window.addEventListener('load', uskladi);
    uskladi();
  }
})();
