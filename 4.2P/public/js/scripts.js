const getAllPlants = () => {
    $.get('/api/plants', (response) => {
        if (response.statusCode === 200) {
            addCards(response.data);
        }
    });
}

const submitForm = () => {
    let formData = {};
    formData.name = $('#name').val();
    formData.scientificName = $('#scientificName').val();
    formData.careLevel = $('#careLevel').val();
    formData.price = $('#price').val();
    formData.image = $('#image').val();
    formData.description = $('#description').val();

    console.log("Form Data Submitted: ", formData);

    if (formData.name && formData.scientificName) {
        postPlant(formData);
    } else {
        M.toast({html: 'Please enter at least Name and Scientific Name'});
    }
}

const postPlant = (plant) => {
    $.ajax({
        url: '/api/plants',
        type: 'POST',
        data: plant,
        success: (result) => {
            if (result.statusCode === 201) {
                M.toast({html: 'Plant added to collection!'});
                // Clear the section and reload
                $("#card-section").empty();
                getAllPlants();
                // Close modal
                $('.modal').modal('close');
            }
        },
        error: (err) => {
            console.error("Error posting plant: ", err);
            M.toast({html: 'Error adding plant. Check console.'});
        }
    });
}

const addCards = (items) => {
    items.forEach(item => {
        let itemToAppend = '<div class="col s4 center-align">' +
            '<div class="card medium">' +
            '<div class="card-image waves-effect waves-block waves-light">' +
            '<img class="activator" src="' + item.image + '" onerror="this.src=\'https://via.placeholder.com/300x200?text=Exotic+Plant\'">' +
            '</div>' +
            '<div class="card-content">' +
                '<span class="card-title activator grey-text text-darken-4">' + item.name + '<i class="material-icons right">more_vert</i></span>' +
                '<p><i>' + item.scientificName + '</i></p>' +
                '<p><strong>Price:</strong> ' + item.price + '</p>' +
            '</div>' +
            '<div class="card-reveal">' +
                '<span class="card-title grey-text text-darken-4">' + item.name + '<i class="material-icons right">close</i></span>' +
                '<p><strong>Care Level:</strong> ' + item.careLevel + '</p>' +
                '<p class="card-text">' + item.description + '</p>' +
            '</div>' +
            '</div>' +
            '</div>';
        $("#card-section").append(itemToAppend)
    });
}

$(document).ready(function () {
    $('.materialboxed').materialbox();
    $('.modal').modal();
    $('select').formSelect(); // Initialize Materialize Select
    
    $('#formSubmit').click(() => {
        submitForm();
    })
    
    getAllPlants();
});
