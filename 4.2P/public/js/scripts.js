const getAllCameras = () => {
    $.get('/api/cameras', (response) => {
        if (response.statusCode === 200) {
            addCards(response.data);
        }
    });
}

const submitForm = () => {
    let formData = {};
    formData.brand = $('#brand').val();
    formData.model = $('#model').val();
    formData.year = $('#year').val();
    formData.format = $('#format').val();
    formData.image = $('#image').val() || 'images/leica.png';
    formData.description = $('#description').val();

    console.log("Form Data Submitted: ", formData);

    if (formData.brand && formData.model) {
        postCamera(formData);
    } else {
        M.toast({html: 'Please enter at least Brand and Model', classes: 'red rounded'});
    }
}

const postCamera = (camera) => {
    $.ajax({
        url: '/api/cameras',
        type: 'POST',
        data: camera,
        success: (result) => {
            if (result.statusCode === 201) {
                M.toast({html: 'Camera added successfully!', classes: 'green rounded'});
                // Clear the section and reload
                $("#card-section").empty();
                getAllCameras();
                // Close modal
                const modalInstance = M.Modal.getInstance(document.getElementById('modal1'));
                modalInstance.close();
                // Reset form
                $('#cameraForm')[0].reset();
            }
        },
        error: (err) => {
            console.error("Error posting camera: ", err);
            M.toast({html: 'Error adding camera. Check console.', classes: 'red rounded'});
        }
    });
}

const addCards = (items) => {
    items.forEach(item => {
        let itemToAppend = `
            <div class="col s12 m6 l4 center-align">
                <div class="card custom-card hoverable">
                    <div class="card-image waves-effect waves-block waves-light" style="background-color: #1e293b;">
                        <img class="activator" src="${item.image}" onerror="this.src='images/livedemo.png'" alt="${item.brand} ${item.model}">
                    </div>
                    <div class="card-content">
                        <span class="card-subtitle">${item.brand}</span>
                        <span class="card-title activator">${item.model} <i class="material-icons right">more_vert</i></span>
                        <div style="margin-top: 15px;">
                            <span class="chip-custom">${item.year}</span>
                            <span class="chip-custom">${item.format}</span>
                        </div>
                    </div>
                    <div class="card-reveal" style="background-color: rgba(30, 41, 59, 0.95); color: #f1f5f9;">
                        <span class="card-title">${item.brand} ${item.model} <i class="material-icons right">close</i></span>
                        <p style="margin-top: 20px; font-size: 1.1rem; line-height: 1.6; color: #cbd5e1;">${item.description}</p>
                    </div>
                </div>
            </div>`;
        $("#card-section").append(itemToAppend);
    });
}

$(document).ready(function () {
    $('.materialboxed').materialbox();
    $('.modal').modal({
        dismissible: true,
        inDuration: 300,
        outDuration: 200,
    });
    $('select').formSelect();
    
    $('#formSubmit').click((e) => {
        e.preventDefault();
        submitForm();
    });
    
    getAllCameras();
});
