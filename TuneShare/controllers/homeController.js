exports.renderHomePage = (req, res) => {
    console.log('Rendering homepage...');
    res.render('index'); // Render the index.handlebars view
};