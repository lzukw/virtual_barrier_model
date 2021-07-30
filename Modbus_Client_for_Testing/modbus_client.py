#!/usr/bin/env python3

import tkinter as tk

from pymodbus.client.sync import ModbusTcpClient
mb_client=ModbusTcpClient(host="127.0.0.1", port=1502)


# global Variables
chk_coils_states = []           # List of values for Checkboxes for the coils
chk_discrete_input_states = []  # List of values for Checkboxes for the discrete inputs

def checkbox_coil_callback():
    coils = []
    for chk_coil_state in chk_coils_states:
        if chk_coil_state.get() == 1:
            coils.append(True)
        else:
            coils.append(False)
    try:
        mb_client.write_coils(0, coils)
    except e:
        print("Could not write coils ...Modbus-Server not running?")
    
def update_discrete_inputs():
    try:
        resp = mb_client.read_discrete_inputs(0, 32)
        if not resp.isError():
            for i in range(32):
                if(resp.getBit(i)):
                    chk_discrete_input_states[i].set(1)
                else:
                    chk_discrete_input_states[i].set(0)
    except:
        print("Could not read discrete Inputs ...Modbus-Server not running?")
        
    root.after(200, update_discrete_inputs)
    

# Tkinter-Elements
root = tk.Tk()
frm_header = tk.Frame(root, borderwidth=1);
frm_header.pack()
frm_col1 = tk.Frame(root, borderwidth=1);
frm_col2 = tk.Frame(root, borderwidth=1);
frm_col1.pack(side=tk.LEFT, padx=5, pady=5)
frm_col2.pack(side=tk.LEFT, padx=5, pady=5)

lbl_header = tk.Label(frm_header, text="Modbus Client")
lbl_header.pack(padx=10, pady=10)
lbl_col1_header = tk.Label(frm_col1, text="Coils")
lbl_col1_header.pack()
lbl_col2_header = tk.Label(frm_col2, text="Discrete Inputs")
lbl_col2_header.pack()

    
for i in range(32):
    chk_state = tk.IntVar()
    chk = tk.Checkbutton(frm_col1, text=f'Coil {i}', variable=chk_state,
                         command = checkbox_coil_callback)
    chk.pack()
    chk_coils_states.append(chk_state)

for i in range(32):
    chk_state = tk.IntVar()
    chk = tk.Checkbutton(frm_col2, text=f'Discrete Input {i}',
                         variable=chk_state )
    chk.pack()
    chk_discrete_input_states.append(chk_state)

root.after(200, update_discrete_inputs)

root.mainloop()
