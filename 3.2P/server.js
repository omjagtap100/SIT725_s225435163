var express = require("express")
var app = express()
app.use(express.static(__dirname+'/public'))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var port = process.env.port || 3000;

const cardList = [
    {
        title: "Music Concert",
        image: "images/event-1.jpg",
        link: "View Details",
        description: "Join us for an amazing night of live music and great vibes."
    },
    {
        title: "Art Exhibition",
        image: "images/event-2.jpg",
        link: "View Details",
        description: "Explore the latest contemporary art from local artists."
    },
    {
        title: "Tech Workshop",
        image: "images/event-3.jpg",
        link: "View Details",
        description: "Master new technologies in our hands-on coding workshop."
    }
];

app.get('/api/projects', (req, res) => {
    res.json({ statusCode: 200, data: cardList, message: "Success" });
});

app.listen(port,()=>{
    console.log("App listening to: "+port)
})
