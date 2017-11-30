
INSERT INTO `article` (`a_id`, `description`, `kind`, `link`, `startstock`, `consumed`) VALUES
	(23, 'Coca Cola', 'Kiste', '/images/drinklogos/cocacola.svg', 250, 0),
	(24, 'Fanta', 'Kiste', '/images/drinklogos/fanta.svg', 20, 0),
	(25, 'Sprite', 'Kiste', '/images/drinklogos/sprite.svg', 10, 0),
	(26, 'Organgen Saft', 'Kiste', '/images/drinklogos/orangejuice.png', 30, 0),
	(27, 'Maracuja Saft', 'Kiste', '/images/drinklogos/maracujajuice.png', 30, 0),
	(28, 'Energy', 'Kiste', '/images/drinklogos/redbull.svg', 20, 0),
	(29, 'Wasser', 'Kiste', '/images/drinklogos/water.png', 10, 0),
	(30, 'Apfelsaft', 'Kiste', '/images/drinklogos/apfelsaft.png', 280, 0),
	(31, 'Tonic Water', 'Kiste', '/images/drinklogos/tomashenrytonicwater.png', 40, 0),
	(32, 'Becks', 'Kiste', '/images/drinklogos/becks.svg', 100, 0),
	(34, 'Astra Rakete', 'Kiste', '/images/drinklogos/astrarakete.png', 100, 2),
	(35, 'Becks Green Lemon', 'Kiste', '/images/drinklogos/becksgreenlemon.png', 25, 0),
	(36, 'Becks Alkoholfrei', 'Kiste', '/images/drinklogos/becksalkoholfrei.png', 20, 3),
	(37, 'Schöfferhofer Grapefruit', 'Kiste', '/images/drinklogos/schoefferhofergrapefruit.png', 40, 0),
	(38, 'Korn', 'Flasche', '/pictures/korn.jpg', 200, 0),
	(39, 'Wodka', 'Flasche', '/images/drinklogos/puschkinvodka.png', 300, 0),
	(40, 'Berentzen Saurer Apfel', 'Flasche', '/images/drinklogos/berentzesaurernapfel.png', 100, 0),
	(41, 'Berentzen Wildkirsche', 'Flasche', '/images/drinklogos/berentzewildkirsche.png', 80, 0),
	(42, 'Jägermeister', 'Flasche', '/images/drinklogos/jaegermeister.svg', 40, 0),
	(43, 'Dry Gin', 'Flasche', '/images/drinklogos/gordongin.svg', 40, 0),
	(44, 'Spiced Äpple', 'Flasche', '/pictures/schöspicedapple.jpg', 30, 0),
	(49, 'Eiswürfel Sack', 'Stück', '/images/drinklogos/eiswuerfel.png', 100, 0),
	(50, 'Astra', 'Kiste', '/images/drinklogos/astra.svg', 200, 0),
	(51, 'Pepsi', 'Kiste', NULL, 100, 0);


INSERT INTO `orders` (`o_id`, `status`, `id`, `datetime`) VALUES
	(1, 'Nicht bearbeitet', 20, '2017-11-19 17:51:45');



INSERT INTO `positions` (`p_id`, `o_id`, `a_id`, `amount`) VALUES
	(321, 1, 34, 2),
	(322, 1, 36, 3);



INSERT INTO `users` (`id`, `name`, `password`, `role`) VALUES
	(18, 'Admin', 'sha1$396b1ed9$1$18bb6bbae8a277f275088b9580b1cbfa1315ab12', 'admin'),
	(20, 'Bar1', 'sha1$02d1462d$1$9b3457649bc8f8d1ac69122aa17132e87a117a45', 'bar'),
	(37, 'Lager1', 'sha1$83aa9e76$1$ce0deccf1a66aceb868bc8c691961e2f9e09ebc2', 'lager'),
	(38, 'bar2', 'sha1$889714d1$1$47971e7019e1bfbc9ce5764c5afb56f3c66ea366', 'bar'),
	(39, 'karsten', 'sha1$4dc18f92$1$d9c076e08f49e03064330c22163045df7b45cbac', 'lager');
