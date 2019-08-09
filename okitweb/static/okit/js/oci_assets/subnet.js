console.log('Loaded Internet Gateway Javascript');

/*
** Set Valid drop Targets
 */

asset_drop_targets["Subnet"] = ["Virtual Cloud Network"];
asset_add_functions["Subnet"] = "addSubnet";

var subnet_svg_height = 200;
var subnet_svg_width = "95%";
var subnet_rect_height = "85%";
var subnet_rect_width = "95%";
var subnet_ids = [];
var subnet_count = 0;
var subnet_position_x = 0;
var subnet_content = {};
var subnet_prefix = 'sn';
var subnet_cidr = {};

/*
** Reset variables
 */

function clearSubnetVariables() {
    subnet_ids = [];
    subnet_count = 0;
    subnet_position_x = 0;
    subnet_content = {};
    subnet_cidr = {};
}

/*
** Add Asset to JSON Model
 */
function addSubnet(vcnid) {
    var id = 'okit-sn-' + uuidv4();

    // Add Virtual Cloud Network to JSON

    if (!('subnets' in OKITJsonObj['compartment'])) {
        OKITJsonObj['compartment']['subnets'] = [];
    }

    // Add id & empty name to id JSON
    okitIdsJsonObj[id] = '';
    subnet_ids.push(id);

    // Increment Count
    subnet_count += 1;
    // Generate Cidr
    vcn_cidr = virtual_cloud_network_cidr[vcnid].split('/')[0].split('.');
    subnet_cidr[id] = vcn_cidr[0] + '.' + vcn_cidr[1] + '.' + (subnet_count - 1) + '.' + vcn_cidr[3] + '/24';
    // Build Subnet Object
    var subnet = {};
    subnet['vcn_id'] = vcnid;
    subnet['virtual_cloud_network'] = '';
    subnet['id'] = id;
    subnet['display_name'] = generateDefaultName(subnet_prefix, subnet_count);
    subnet['cidr_block'] = subnet_cidr[id];
    subnet['dns_label'] = subnet['display_name'].toLowerCase().slice(-5);
    subnet['route_table'] = '';
    subnet['route_table_id'] = '';
    subnet['security_lists'] = [];
    subnet['security_list_ids'] = [];
    OKITJsonObj['compartment']['subnets'].push(subnet);
    console.log(JSON.stringify(OKITJsonObj, null, 2));
    okitIdsJsonObj[id] = subnet['display_name'];

    initialiseSubnetChildData(id);

    displayOkitJson();
    drawSubnetSVG(subnet);
}

function initialiseSubnetChildData(id) {
    // Set subnet specific positioning variables
    subnet_content[id] = {}
    subnet_content[id]['load_balancer_count'] = 0;
    subnet_content[id]['load_balancer_position'] = 0;
    subnet_content[id]['instance_count'] = 0;
    subnet_content[id]['instance_position'] = 0;
}

/*
** SVG Creation
 */
function drawSubnetSVG(subnet) {
    var vcnid = subnet['vcn_id'];
    var id = subnet['id'];
    var position = subnet_position_x;
    var vcn_offset_x = (icon_width / 2);
    var vcn_offset_y = ((icon_height / 4) * 8) + ((icon_height + vcn_icon_spacing) * 1);
    var count_offset_x = (icon_width * position) + (vcn_icon_spacing * position);
    var count_offset_y = ((subnet_svg_height + vcn_icon_spacing) * (subnet_count -1));
    var svg_x = vcn_offset_x + count_offset_x;
    var svg_y = vcn_offset_y + count_offset_y;
    var data_type = "Subnet";

    var okitcanvas_svg = d3.select('#' + vcnid + "-svg");
    var svg = okitcanvas_svg.append("svg")
        .attr("id", id + '-svg')
        .attr("data-type", data_type)
        .attr("data-vcnid", vcnid)
        .attr("title", subnet['display_name'])
        .attr("x", svg_x)
        .attr("y", svg_y)
        .attr("width", subnet_svg_width)
        .attr("height", subnet_svg_height);
    var rect = svg.append("rect")
        .attr("id", id)
        .attr("data-type", data_type)
        .attr("data-vcnid", vcnid)
        .attr("title", subnet['display_name'])
        .attr("x", icon_x)
        .attr("y", icon_y)
        //.attr("width", vcn_width - (icon_width * 2))
        .attr("width", subnet_rect_width)
        .attr("height", subnet_rect_height)
        .attr("stroke", subnet_stroke_colour[(subnet_count % 3)])
        //.attr("stroke-dasharray", "5, 5")
        .attr("fill", subnet_stroke_colour[(subnet_count % 3)])
        .attr("style", "fill-opacity: .25;");
    rect.append("title")
        .text("Subnet: " + subnet['display_name']);
    var g = svg.append("g")
        .attr("transform", "translate(-20, -20) scale(0.3, 0.3)");
    g.append("path")
        .attr("class", "st0")
        .attr("d", "M142.7,138v-13.5h-8.4v-20.8h20.8v20.8h-8.4V138h52.8c-3-27.4-26.2-48.8-54.4-48.8c-28.2,0-51.4,21.3-54.4,48.8H142.7z")
    g.append("path")
        .attr("class", "st0")
        .attr("d", "M170,142v14.6h8.4v20.8h-20.8v-20.8h8.4V142h-41.5v14.6h8.4v20.8H112v-20.8h8.4V142H90.5c0,0.7-0.1,1.3-0.1,2c0,30.2,24.5,54.7,54.7,54.7c30.2,0,54.7-24.5,54.7-54.7c0-0.7-0.1-1.3-0.1-2H170z")

    // Add click event to display properties
    $('#' + id).on("click", function() { loadSubnetProperties(id) });
    d3.select('svg#' + id + '-svg').selectAll('path')
        .on("click", function() { loadSubnetProperties(id) });
    loadSubnetProperties(id);

    // Add Drag Event to allow connector (Currently done a mouse events because SVG does not have drag version)
    $('#' + id).on("mousedown", handleConnectorDragStart);
    $('#' + id).on("mousemove", handleConnectorDrag);
    $('#' + id).on("mouseup", handleConnectorDrop);
    $('#' + id).on("mouseover", handleConnectorDragEnter);
    $('#' + id).on("mouseout", handleConnectorDragLeave);
    // Add dragevent versions
    $('#' + id).on("dragstart", handleConnectorDragStart);
    $('#' + id).on("drop", handleConnectorDrop);
    $('#' + id).on("dragenter", handleConnectorDragEnter);
    $('#' + id).on("dragleave", handleConnectorDragLeave);
    d3.select('#' + id)
        .attr("dragable", true);
}

function clearSubnetConnectorsSVG(subnet) {
    var id = subnet['id'];
    d3.selectAll("line[id*='" + id + "']").remove();
}

function drawSubnetConnectorsSVG(subnet) {
    var vcnid = subnet['vcn_id'];
    var id = subnet['id'];
    var boundingClientRect = d3.select("#" + id).node().getBoundingClientRect();
    var parent_svg = document.getElementById(vcnid + "-svg");

    // Define SVG position manipulation variables
    var svgPoint = parent_svg.createSVGPoint();
    var screenCTM = parent_svg.getScreenCTM();
    svgPoint.x = boundingClientRect.x + (boundingClientRect.width/2);
    svgPoint.y = boundingClientRect.y;

    var subnetrelative = svgPoint.matrixTransform(screenCTM.inverse());
    var sourcesvg = null;

    svg = d3.select('#' + vcnid + "-svg");

    if (subnet['route_table_id'] != '') {
        boundingClientRect = d3.select("#" + subnet['route_table_id']).node().getBoundingClientRect();
        svgPoint.x = boundingClientRect.x + (boundingClientRect.width/2);
        svgPoint.y = boundingClientRect.y + boundingClientRect.height;
        sourcesvg = svgPoint.matrixTransform(screenCTM.inverse());
        svg.append('line')
            .attr("id", generateConnectorId(subnet['route_table_id'], id))
            .attr("x1", sourcesvg.x)
            .attr("y1", sourcesvg.y)
            .attr("x2", subnetrelative.x)
            .attr("y2", subnetrelative.y)
            .attr("stroke-width", "2")
            .attr("stroke", "black");
    }

    if (subnet['security_list_ids'].length > 0) {
        for (var i = 0; i < subnet['security_list_ids'].length; i++) {
            boundingClientRect = d3.select("#" + subnet['security_list_ids'][i]).node().getBoundingClientRect();
            svgPoint.x = boundingClientRect.x + (boundingClientRect.width/2);
            svgPoint.y = boundingClientRect.y + boundingClientRect.height;
            sourcesvg = svgPoint.matrixTransform(screenCTM.inverse());
            svg.append('line')
                .attr("id", generateConnectorId(subnet['security_list_ids'][i], id))
                .attr("x1", sourcesvg.x)
                .attr("y1", sourcesvg.y)
                .attr("x2", subnetrelative.x)
                .attr("y2", subnetrelative.y)
                .attr("stroke-width", "2")
                .attr("stroke", "black");
        }
    }
}

/*
** Property Sheet Load function
 */
function loadSubnetProperties(id) {
    $("#properties").load("propertysheets/subnet.html", function () {
        var name_id_mapping = {"security_lists": "security_list_ids",
                                "security_list_ids": "security_lists",
                                "route_table": "route_table_id",
                                "route_table_id": "route_table"};
        if ('compartment' in OKITJsonObj && 'subnets' in OKITJsonObj['compartment']) {
            console.log('Loading Subnet: ' + id);
            var json = OKITJsonObj['compartment']['subnets'];
            for (var i = 0; i < json.length; i++) {
                subnet = json[i];
                //console.log(JSON.stringify(subnet, null, 2));
                if (subnet['id'] == id) {
                    //console.log('Found Subnet: ' + id);
                    subnet['virtual_cloud_network'] = okitIdsJsonObj[subnet['vcn_id']];
                    $("#virtual_cloud_network").html(subnet['virtual_cloud_network']);
                    $('#display_name').val(subnet['display_name']);
                    $('#cidr_block').val(subnet['cidr_block']);
                    $('#dns_label').val(subnet['dns_label']);
                    var route_table_select = $('#route_table_id');
                    //console.log('Route Table Ids: ' + route_table_ids);
                    for (var rtcnt = 0; rtcnt < route_table_ids.length; rtcnt++) {
                        var rtid = route_table_ids[rtcnt];
                        if (rtid == subnet['route_table_id']) {
                            route_table_select.append($('<option>').attr('value', rtid).attr('selected', 'selected').text(okitIdsJsonObj[rtid]));
                        } else {
                            route_table_select.append($('<option>').attr('value', rtid).text(okitIdsJsonObj[rtid]));
                        }

                    }
                    var security_lists_select = $('#security_list_ids');
                    //console.log('Security List Ids: ' + security_list_ids);
                    for (var slcnt = 0; slcnt < security_list_ids.length; slcnt++) {
                        var slid = security_list_ids[slcnt];
                        if (subnet['security_list_ids'].indexOf(slid) >= 0) {
                            security_lists_select.append($('<option>').attr('value', slid).attr('selected', 'selected').text(okitIdsJsonObj[slid]));
                        } else {
                            security_lists_select.append($('<option>').attr('value', slid).text(okitIdsJsonObj[slid]));
                        }
                    }
                    var inputfields = document.querySelectorAll('.property-editor-table input');
                    [].forEach.call(inputfields, function (inputfield) {
                        inputfield.addEventListener('change', function () {
                            subnet[inputfield.id] = inputfield.value;
                            // If this is the name field copy to the Ids Map
                            if (inputfield.id == 'display_name') {
                                okitIdsJsonObj[id] = inputfield.value;
                            }
                            displayOkitJson();
                        });
                    });
                    inputfields = document.querySelectorAll('.property-editor-table select');
                    [].forEach.call(inputfields, function (inputfield) {
                        inputfield.addEventListener('change', function () {
                            // Check if Multi Select
                            if (inputfield.multiple) {
                                selectedopts = inputfield.querySelectorAll('option:checked');
                                if (selectedopts.length > 0) {
                                    subnet[inputfield.id] = Array.from(selectedopts, e=>e.value);
                                    //subnet[inputfield.id.substring(0, inputfield.id.length - 3)] = Array.from(selectedopts, e=>e.text);
                                    subnet[name_id_mapping[inputfield.id]] = Array.from(selectedopts, e=>e.text);
                                } else {
                                    subnet[inputfield.id] = [];
                                    //subnet[inputfield.id.substring(0, inputfield.id.length - 3)] = [];
                                    subnet[name_id_mapping[inputfield.id]] = [];
                                }
                            } else {
                                subnet[inputfield.id] = inputfield.options[inputfield.selectedIndex].value;
                                //subnet[inputfield.id.substring(0, inputfield.id.length - 3)] = inputfield.options[inputfield.selectedIndex].text;
                                subnet[name_id_mapping[inputfield.id]] = inputfield.options[inputfield.selectedIndex].text;
                            }
                            // If this is the name field copy to the Ids Map
                            displayOkitJson();
                            // Redraw Connectors
                            clearSubnetConnectorsSVG(subnet);
                            drawSubnetConnectorsSVG(subnet);
                        });
                    });
                    break;
                }
            }
        }
    });
}

/*
** OKIT Json Update Function
 */
function updateSubnetLinks(sourcetype, sourceid, id) {
    var subnets = OKITJsonObj['compartment']['subnets'];
    console.log('Updating Subnet ' + id + 'Adding ' + sourcetype + ' ' +sourceid);
    for (var i = 0; i < subnets.length; i++) {
        subnet = subnets[i];
        console.log('Before : ' + JSON.stringify(subnet, null, 2));
        if (subnet['id'] == id) {
            if (sourcetype == 'Route Table') {
                if (subnet['route_table_id'] != '') {
                    // Only single Route Table allow so delete existing line.
                    console.log('Deleting Connector : ' + generateConnectorId(subnet['route_table_id'], id));
                    d3.select("#" + generateConnectorId(subnet['route_table_id'], id)).remove();
                }
                subnet['route_table_id'] = sourceid;
                subnet['route_table'] = okitIdsJsonObj[sourceid];
            } else if (sourcetype == 'Security List') {
                if (subnet['security_list_ids'].indexOf(sourceid) >0 ) {
                    // Already connected so delete existing line
                    console.log('Deleting Connector : ' + generateConnectorId(sourceid, id));
                    d3.select("#" + generateConnectorId(sourceid, id)).remove();
                } else {
                    subnet['security_list_ids'].push(sourceid);
                    subnet['security_lists'].push(okitIdsJsonObj[sourceid]);
                }
            }
        }
        console.log('After : ' + JSON.stringify(subnet, null, 2));
    }
    displayOkitJson();
    loadSubnetProperties(id);
}

clearSubnetVariables();
